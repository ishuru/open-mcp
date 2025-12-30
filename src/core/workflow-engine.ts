/**
 * Workflow Engine
 * Executes workflows with conditional logic and loops
 */

import {
  Workflow,
  WorkflowStep,
  WorkflowExecutionContext,
  WorkflowResult,
  WorkflowStepResult,
  ExpressionEvaluator,
  ToolStepConfig,
  SkillStepConfig,
  PromptStepConfig,
  ConditionStepConfig,
  LoopStepConfig,
} from "../types/workflows.js";
import { Skill as SkillType } from "../types/skills.js";

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
// Executor Interfaces
// ============================================================================

export interface ToolExecutor {
  executeTool(toolName: string, parameters: Record<string, unknown>): Promise<unknown>;
}

export interface ISkillExecutorClient {
  execute(skill: SkillType, inputs: Record<string, unknown>): Promise<unknown>;
}

export interface PromptExecutor {
  renderPrompt(promptId: string, parameters: Record<string, unknown>): Promise<string>;
}

// ============================================================================
// Expression Evaluator Implementation
// ============================================================================

class WorkflowExpressionEvaluator implements ExpressionEvaluator {
  isReference(value: string): boolean {
    return value.startsWith("${") && value.endsWith("}");
  }

  resolve(reference: string, context: WorkflowExecutionContext): unknown {
    // Remove ${ and }
    const path = reference.slice(2, -1);

    // Handle variable references like "${variables.myVar}"
    if (path.startsWith("variables.")) {
      return get(context.variables, path.slice(10));
    }
    if (path === "variables") {
      return context.variables;
    }

    // Handle result references like "${results.stepId}"
    if (path.startsWith("results.")) {
      const stepId = path.slice(8);
      const stepResult = context.results.get(stepId);
      return stepResult?.result;
    }
    if (path === "results") {
      return Array.from(context.results.entries()).reduce((acc, [id, result]) => {
        acc[id] = result.result;
        return acc;
      }, {} as Record<string, unknown>);
    }

    // Handle state references like "${state.currentStep}"
    if (path.startsWith("state.")) {
      return get(context.state, path.slice(6));
    }

    // Direct variable reference
    return get(context.variables, path);
  }

  evaluate(expression: string, context: WorkflowExecutionContext): unknown {
    // If it's a simple reference, resolve it
    if (this.isReference(expression)) {
      return this.resolve(expression, context);
    }

    // Handle simple comparisons
    // Format: "${ref} operator value" or "${ref} operator ${ref2}"
    const comparisonRegex =
      /^\$\{([^}]+)\}\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/;
    const match = expression.match(comparisonRegex);

    if (match) {
      const [, ref1, operator, ref2OrValue] = match;
      const val1 = this.resolve(`\${${ref1}}`, context);
      let val2: unknown;

      // Check if ref2OrValue is also a reference
      if (this.isReference(ref2OrValue.trim())) {
        val2 = this.resolve(ref2OrValue.trim(), context);
      } else {
        // Try to parse as number or boolean
        if (ref2OrValue === "true") val2 = true;
        else if (ref2OrValue === "false") val2 = false;
        else if (ref2OrValue === "null") val2 = null;
        else if (!isNaN(Number(ref2OrValue))) val2 = Number(ref2OrValue);
        else val2 = ref2OrValue;
      }

      // Evaluate comparison
      switch (operator) {
        case "===":
          return val1 === val2;
        case "!==":
          return val1 !== val2;
        case "==":
          return val1 == val2; // eslint-disable-line eqeqeq
        case "!=":
          return val1 != val2; // eslint-disable-line eqeqeq
        case ">=":
          return typeof val1 === "number" && typeof val2 === "number" && val1 >= val2;
        case "<=":
          return typeof val1 === "number" && typeof val2 === "number" && val1 <= val2;
        case ">":
          return typeof val1 === "number" && typeof val2 === "number" && val1 > val2;
        case "<":
          return typeof val1 === "number" && typeof val2 === "number" && val1 < val2;
      }
    }

    // Handle boolean expressions (simple truthiness check)
    const refMatch = expression.match(/^\$\{([^}]+)\}$/);
    if (refMatch) {
      const value = this.resolve(expression, context);
      return Boolean(value);
    }

    // Return as-is if we can't evaluate
    return expression;
  }

  resolveObject(
    obj: Record<string, unknown>,
    context: WorkflowExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && this.isReference(value)) {
        resolved[key] = this.resolve(value, context);
      } else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        resolved[key] = this.resolveObject(value as Record<string, unknown>, context);
      } else if (Array.isArray(value)) {
        resolved[key] = value.map((item) => {
          if (typeof item === "string" && this.isReference(item)) {
            return this.resolve(item, context);
          }
          if (
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
          ) {
            return this.resolveObject(item as Record<string, unknown>, context);
          }
          return item;
        });
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
}

// ============================================================================
// Workflow Engine Class
// ============================================================================

export class WorkflowEngine {
  private toolExecutor: ToolExecutor;
  private skillExecutor: ISkillExecutorClient;
  private promptExecutor: PromptExecutor;
  private evaluator: ExpressionEvaluator;
  private skillsRegistry: Map<string, SkillType>;

  constructor(
    toolExecutor: ToolExecutor,
    skillExecutor: ISkillExecutorClient,
    promptExecutor: PromptExecutor,
    skillsRegistry: Map<string, SkillType>
  ) {
    this.toolExecutor = toolExecutor;
    this.skillExecutor = skillExecutor;
    this.promptExecutor = promptExecutor;
    this.evaluator = new WorkflowExpressionEvaluator();
    this.skillsRegistry = skillsRegistry;
  }

  /**
   * Execute a workflow with optional initial variables
   */
  async execute(
    workflow: Workflow,
    initialVars?: Record<string, unknown>
  ): Promise<WorkflowResult> {
    const startTime = Date.now();

    // Create execution context
    const context: WorkflowExecutionContext = {
      variables: { ...workflow.variables, ...initialVars },
      results: new Map(),
      state: {
        currentStep: 0,
        startTime,
        completedSteps: [],
        failedSteps: [],
      },
    };

    try {
      // Execute each step
      for (let i = 0; i < workflow.steps.length; i++) {
        context.state.currentStep = i;
        const step = workflow.steps[i];

        // Check run condition if present
        if (step.runCondition) {
          const shouldRun = Boolean(this.evaluator.evaluate(step.runCondition, context));
          if (!shouldRun) {
            continue; // Skip this step
          }
        }

        try {
          const result = await this.executeStep(step, context);
          const stepResult: WorkflowStepResult = {
            stepId: step.id,
            success: true,
            result,
            retries: 0,
            duration: 0,
          };
          context.results.set(step.id, stepResult);
          context.state.completedSteps.push(step.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const stepResult: WorkflowStepResult = {
            stepId: step.id,
            success: false,
            error: errorMessage,
            retries: 0,
            duration: 0,
          };
          context.results.set(step.id, stepResult);
          context.state.failedSteps.push(step.id);

          // Handle error based on onError setting
          if (step.onError === "continue") {
            continue; // Continue to next step
          } else if (step.onError === "retry" && step.retryCount) {
            // Retry logic
            let success = false;
            for (let r = 0; r < step.retryCount; r++) {
              try {
                const result = await this.executeStep(step, context);
                const retryResult: WorkflowStepResult = {
                  stepId: step.id,
                  success: true,
                  result,
                  retries: r + 1,
                  duration: 0,
                };
                context.results.set(step.id, retryResult);
                context.state.failedSteps = context.state.failedSteps.filter(
                  (id) => id !== step.id
                );
                success = true;
                break;
              } catch {
                // Continue retrying
              }
            }
            if (!success) {
              return {
                success: false,
                variables: context.variables,
                results: context.results,
                error: `Step '${step.id}' failed after ${step.retryCount} retries`,
                duration: Date.now() - startTime,
              };
            }
          } else {
            // Default: stop on error
            return {
              success: false,
              variables: context.variables,
              results: context.results,
              error: `Step '${step.id}' failed: ${errorMessage}`,
              duration: Date.now() - startTime,
            };
          }
        }
      }

      return {
        success: context.state.failedSteps.length === 0,
        variables: context.variables,
        results: context.results,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        variables: context.variables,
        results: context.results,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a single workflow step based on its type
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    switch (step.type) {
      case "tool":
        return this.executeToolStep(step.config as ToolStepConfig, context);
      case "skill":
        return this.executeSkillStep(step.config as SkillStepConfig, context);
      case "prompt":
        return this.executePromptStep(step.config as PromptStepConfig, context);
      case "condition":
        return this.executeConditionStep(step.config as ConditionStepConfig, context);
      case "loop":
        return this.executeLoopStep(step, context);
      default:
        throw new Error(`Unknown step type: ${(step as { type: string }).type}`);
    }
  }

  /**
   * Execute a tool step
   */
  private async executeToolStep(
    config: ToolStepConfig,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    const resolvedParams = this.evaluator.resolveObject(config.parameters, context);
    return this.toolExecutor.executeTool(config.tool, resolvedParams);
  }

  /**
   * Execute a skill step
   */
  private async executeSkillStep(
    config: SkillStepConfig,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    const resolvedInputs = this.evaluator.resolveObject(config.inputs, context);
    const skill = this.skillsRegistry.get(config.skill);
    if (!skill) {
      throw new Error(`Skill not found: ${config.skill}`);
    }
    return this.skillExecutor.execute(skill, resolvedInputs);
  }

  /**
   * Execute a prompt step
   */
  private async executePromptStep(
    config: PromptStepConfig,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    const resolvedParams = this.evaluator.resolveObject(config.parameters, context);
    return this.promptExecutor.renderPrompt(config.prompt, resolvedParams);
  }

  /**
   * Execute a condition step
   */
  private async executeConditionStep(
    config: ConditionStepConfig,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    const conditionResult = Boolean(this.evaluator.evaluate(config.condition, context));

    const stepsToExecute = conditionResult ? config.then : config.else;

    if (stepsToExecute) {
      for (const step of stepsToExecute) {
        // Check run condition
        if (step.runCondition) {
          const shouldRun = Boolean(this.evaluator.evaluate(step.runCondition, context));
          if (!shouldRun) continue;
        }
        await this.executeStep(step, context);
      }
    }

    return { conditionResult };
  }

  /**
   * Execute a loop step
   */
  private async executeLoopStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<unknown> {
    const config = step.config as LoopStepConfig;

    // Get the array to iterate over
    const arrayRef = this.evaluator.resolve(config.over, context);
    const array = Array.isArray(arrayRef) ? arrayRef : [];

    const results: unknown[] = [];

    for (const item of array) {
      // Create a new variable scope with the loop variable
      const loopContext: WorkflowExecutionContext = {
        ...context,
        variables: {
          ...context.variables,
          [config.variable]: item,
        },
      };

      // Execute each step in the loop
      for (const loopStep of config.steps) {
        const result = await this.executeStep(loopStep, loopContext);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Set a custom expression evaluator
   */
  setEvaluator(evaluator: ExpressionEvaluator): void {
    this.evaluator = evaluator;
  }
}
