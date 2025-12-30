/**
 * Skill Executor
 * Executes skills by composing multiple tool calls
 */

import {
  Skill,
  SkillExecutionContext,
  SkillResult,
  SkillStepResult,
  ReferenceResolver,
} from "../types/skills.js";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely get a nested property from an object using dot notation
 */
function get(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current == null) {
      return undefined;
    }
    if (typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// ============================================================================
// Tool Executor Interface
// ============================================================================

/**
 * Interface for executing tools
 * This is implemented by the MCP server or a mock for testing
 */
export interface ToolExecutor {
  executeTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// Reference Resolver Implementation
// ============================================================================

class SkillReferenceResolver implements ReferenceResolver {
  resolve(ref: string, context: SkillExecutionContext): unknown {
    // Handle result references like "${result.0.text}" or "${result.readFile.text}"
    if (ref.startsWith("${result.")) {
      const path = ref.slice(10, -1); // Remove "${result." and "}"
      // Try to get from step results by name
      if (context.results.has(path)) {
        return context.results.get(path);
      }
      // Try numeric index
      const parts = path.split(".");
      const index = parseInt(parts[0], 10);
      if (!isNaN(index)) {
        const resultsArray = Array.from(context.results.values());
        if (index < resultsArray.length) {
          return parts.length > 1
            ? get(resultsArray[index], parts.slice(1).join("."))
            : resultsArray[index];
        }
      }
      return get(Array.from(context.results.values()), path);
    }

    // Handle input references like "${input.path}"
    if (ref.startsWith("${input.")) {
      const path = ref.slice(9, -1); // Remove "${input." and "}"
      return get(context.inputs, path);
    }

    // Handle metadata references like "${metadata.startTime}"
    if (ref.startsWith("${metadata.")) {
      const path = ref.slice(11, -1); // Remove "${metadata." and "}"
      return get(context.metadata, path);
    }

    // Not a reference, return as-is
    return ref;
  }

  resolveObject(
    params: Record<string, unknown> | string,
    context: SkillExecutionContext
  ): Record<string, unknown> {
    // If it's a string, it might be a reference
    if (typeof params === "string") {
      const resolved = this.resolve(params, context);
      // If the resolved value is an object, return it; otherwise wrap in value key
      return typeof resolved === "object" && resolved !== null
        ? (resolved as Record<string, unknown>)
        : { value: resolved };
    }

    // Resolve each property value
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.startsWith("${")) {
        resolved[key] = this.resolve(value, context);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        resolved[key] = this.resolveObject(value as Record<string, unknown>, context);
      } else if (Array.isArray(value)) {
        resolved[key] = value.map((item) =>
          typeof item === "string" && item.startsWith("${")
            ? this.resolve(item, context)
            : item
        );
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
}

// ============================================================================
// Skill Executor Class
// ============================================================================

export class SkillExecutor {
  private toolExecutor: ToolExecutor;
  private resolver: ReferenceResolver;

  constructor(toolExecutor: ToolExecutor) {
    this.toolExecutor = toolExecutor;
    this.resolver = new SkillReferenceResolver();
  }

  /**
   * Execute a skill with the given inputs
   */
  async execute(skill: Skill, inputs: Record<string, unknown>): Promise<SkillResult> {
    const startTime = Date.now();
    const steps: SkillStepResult[] = [];

    // Create execution context
    const context: SkillExecutionContext = {
      inputs,
      results: new Map(),
      metadata: {
        startTime,
        currentStep: 0,
        totalSteps: skill.tools.length,
      },
    };

    // Execute each step in sequence
    for (let i = 0; i < skill.tools.length; i++) {
      context.metadata.currentStep = i + 1;
      const step = skill.tools[i];
      const stepName = step.name || `step_${i}`;

      try {
        const stepResult = await this.executeStep(step, context);
        steps.push({
          name: stepName,
          success: true,
          result: stepResult,
        });
        context.results.set(stepName, stepResult);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        steps.push({
          name: stepName,
          success: false,
          error: errorMessage,
        });

        // If step is not optional, fail the skill
        if (!step.optional) {
          return {
            success: false,
            output: undefined,
            steps,
            error: `Step '${stepName}' failed: ${errorMessage}`,
            duration: Date.now() - startTime,
          };
        }
        // For optional steps, store the error and continue
        context.results.set(stepName, { error: errorMessage });
      }
    }

    // Determine final output (last step's result or all results)
    const lastResult = steps.length > 0 ? steps[steps.length - 1].result : undefined;

    return {
      success: true,
      output: lastResult,
      steps,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute a single skill step
   */
  private async executeStep(
    step: { tool: string; parameters: Record<string, unknown> | string; optional?: boolean },
    context: SkillExecutionContext
  ): Promise<unknown> {
    // Resolve parameters (handle references like "${input.path}")
    const resolvedParams = this.resolver.resolveObject(step.parameters, context);

    // Execute the tool
    return this.toolExecutor.executeTool(step.tool, resolvedParams);
  }

  /**
   * Validate inputs against a skill's input schema
   */
  validateInputs(skill: Skill, inputs: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    const required = skill.inputSchema.required || [];
    for (const field of required) {
      if (!(field in inputs)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    const properties = skill.inputSchema.properties;
    for (const [key, value] of Object.entries(inputs)) {
      const schema = properties[key];
      if (!schema) {
        errors.push(`Unknown field: ${key}`);
        continue;
      }

      // Validate type
      if (!this.validateType(value, schema.type)) {
        errors.push(`Field '${key}' should be type '${schema.type}', got '${typeof value}'`);
      }

      // Validate enum if present
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Field '${key}' must be one of: ${schema.enum.join(", ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a value matches the expected type
   */
  private validateType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return typeof value === "object" && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Create a new reference resolver (for testing or custom resolution)
   */
  setResolver(resolver: ReferenceResolver): void {
    this.resolver = resolver;
  }

  /**
   * Get the current tool executor
   */
  getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }
}

// ============================================================================
// MCP Tool Executor Implementation
// ============================================================================

/**
 * Implementation of ToolExecutor that delegates to MCP server tools
 * This bridges the skill executor with the MCP server's tool registry
 */
export class McpToolExecutor implements ToolExecutor {
  private toolCallHandlers: Map<string, (args: Record<string, unknown>) => Promise<unknown>>;

  constructor() {
    this.toolCallHandlers = new Map();
  }

  /**
   * Register a tool handler
   */
  registerTool(
    toolName: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.toolCallHandlers.set(toolName, handler);
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown> {
    const handler = this.toolCallHandlers.get(toolName);
    if (!handler) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return handler(parameters);
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.toolCallHandlers.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.toolCallHandlers.keys());
  }
}
