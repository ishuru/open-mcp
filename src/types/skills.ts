/**
 * Skill-related type definitions for the Modular MCP Server
 * Defines the structure for pre-defined task sequences that compose tools
 */

// ============================================================================
// Skill Types
// ============================================================================

export interface Skill {
  /** Unique identifier for the skill */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the skill does */
  description: string;
  /** Category for organization */
  category: string;
  /** Sequence of tool calls that make up the skill */
  tools: SkillStep[];
  /** JSON Schema for skill input validation */
  inputSchema: SkillInputSchema;
  /** JSON Schema for skill output description */
  outputSchema: SkillOutputSchema;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

export interface SkillStep {
  /** The tool to call (must be a registered tool ID) */
  tool: string;
  /** Parameters for the tool call.
   *  - If object: static parameters or references like "${input.path}"
   *  - If string: reference to previous result like "${result.0.text}"
   */
  parameters: Record<string, unknown> | string;
  /** Whether this step is optional (errors won't fail the skill) */
  optional?: boolean;
  /** Name for this step (used for result references) */
  name?: string;
}

// ============================================================================
// Skill Schema Types
// ============================================================================

export interface SkillInputSchema {
  type: "object";
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface SkillOutputSchema {
  type: "object" | "array" | "string";
  properties?: Record<string, PropertySchema>;
  description?: string;
}

export interface PropertySchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  default?: unknown;
  enum?: unknown[];
}

// ============================================================================
// Execution Context Types
// ============================================================================

export interface SkillExecutionContext {
  /** Input parameters provided to the skill */
  inputs: Record<string, unknown>;
  /** Results from each step (indexed by step name or index) */
  results: Map<string, unknown>;
  /** Additional metadata about execution */
  metadata: {
    startTime: number;
    currentStep: number;
    totalSteps: number;
  };
}

export interface SkillResult {
  /** Whether the skill executed successfully */
  success: boolean;
  /** Output from the skill */
  output: unknown;
  /** Individual step results */
  steps: SkillStepResult[];
  /** Error if skill failed */
  error?: string;
  /** Execution time in milliseconds */
  duration: number;
}

export interface SkillStepResult {
  /** Step name or index */
  name: string;
  /** Whether this step succeeded */
  success: boolean;
  /** Result from the tool call */
  result?: unknown;
  /** Error if step failed */
  error?: string;
}

// ============================================================================
// Reference Resolution Types
// ============================================================================

export interface ReferenceResolver {
  /** Resolve a parameter reference like "${input.path}" */
  resolve(ref: string, context: SkillExecutionContext): unknown;
  /** Resolve all parameters in a parameter object */
  resolveObject(params: Record<string, unknown> | string, context: SkillExecutionContext): Record<string, unknown>;
}

// ============================================================================
// Skill Category Types
// ============================================================================

export type SkillCategoryType =
  | "document"
  | "development"
  | "productivity"
  | "research"
  | "communication"
  | "system";
