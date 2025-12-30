/**
 * Workflow-related type definitions for the Modular MCP Server
 * Defines the structure for multi-step automation pipelines
 */

// ============================================================================
// Workflow Types
// ============================================================================

export interface Workflow {
  /** Unique identifier for the workflow */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the workflow does */
  description: string;
  /** Steps that make up the workflow */
  steps: WorkflowStep[];
  /** Initial variable values for the workflow */
  variables?: Record<string, unknown>;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

export interface WorkflowStep {
  /** Unique identifier for this step */
  id: string;
  /** Type of step determines what config to use */
  type: "tool" | "skill" | "prompt" | "condition" | "loop";
  /** Human-readable name for this step */
  name: string;
  /** Configuration specific to the step type */
  config: WorkflowStepConfig;
  /** What to do on error */
  onError?: "stop" | "continue" | "retry";
  /** Number of retries if onError is "retry" */
  retryCount?: number;
  /** Optional condition to determine if step should run */
  runCondition?: string;
}

// ============================================================================
// Step Configuration Types
// ============================================================================

export type WorkflowStepConfig =
  | ToolStepConfig
  | SkillStepConfig
  | PromptStepConfig
  | ConditionStepConfig
  | LoopStepConfig;

/** Configuration for tool steps */
export interface ToolStepConfig {
  /** Tool ID to call */
  tool: string;
  /** Parameters to pass to the tool */
  parameters: Record<string, unknown>;
}

/** Configuration for skill steps */
export interface SkillStepConfig {
  /** Skill ID to execute */
  skill: string;
  /** Inputs to pass to the skill */
  inputs: Record<string, unknown>;
}

/** Configuration for prompt steps */
export interface PromptStepConfig {
  /** Prompt template ID to render */
  prompt: string;
  /** Parameters for the prompt template */
  parameters: Record<string, unknown>;
}

/** Configuration for conditional steps */
export interface ConditionStepConfig {
  /** Expression to evaluate (supports references like "${variables.hasChanges}") */
  condition: string;
  /** Steps to execute if condition is true */
  then: WorkflowStep[];
  /** Optional steps to execute if condition is false */
  else?: WorkflowStep[];
}

/** Configuration for loop steps */
export interface LoopStepConfig {
  /** Array expression to iterate over (e.g., "${variables.items}") */
  over: string;
  /** Variable name for each item */
  variable: string;
  /** Steps to execute for each iteration */
  steps: WorkflowStep[];
}

// ============================================================================
// Execution Context Types
// ============================================================================

export interface WorkflowExecutionContext {
  /** Workflow variables (can be referenced in steps) */
  variables: Record<string, unknown>;
  /** Results from each step (indexed by step ID) */
  results: Map<string, WorkflowStepResult>;
  /** Current execution state */
  state: {
    currentStep: number;
    startTime: number;
    completedSteps: string[];
    failedSteps: string[];
  };
}

export interface WorkflowResult {
  /** Whether the workflow executed successfully */
  success: boolean;
  /** Final workflow variables */
  variables: Record<string, unknown>;
  /** Results from each step (aliased as steps for compatibility) */
  results: Map<string, WorkflowStepResult>;
  /** Error if workflow failed */
  error?: string;
  /** Execution time in milliseconds */
  duration: number;
}

export interface WorkflowStepResult {
  /** Step ID */
  stepId: string;
  /** Whether this step succeeded */
  success: boolean;
  /** Result from the step execution */
  result?: unknown;
  /** Error if step failed */
  error?: string;
  /** Number of retries attempted */
  retries: number;
  /** Execution time in milliseconds */
  duration: number;
}

// ============================================================================
// Expression Evaluation Types
// ============================================================================

export interface ExpressionEvaluator {
  /** Evaluate an expression string with access to context */
  evaluate(expression: string, context: WorkflowExecutionContext): unknown;
  /** Check if an expression is a reference */
  isReference(value: string): boolean;
  /** Resolve a reference to its value */
  resolve(reference: string, context: WorkflowExecutionContext): unknown;
  /** Resolve all references in an object */
  resolveObject(obj: Record<string, unknown>, context: WorkflowExecutionContext): Record<string, unknown>;
}

// ============================================================================
// Variable Scope Types
// ============================================================================

export interface VariableScope {
  /** Local variables (current step/scope) */
  local: Record<string, unknown>;
  /** Workflow variables (shared across all steps) */
  workflow: Record<string, unknown>;
  /** Results from previous steps */
  results: Map<string, unknown>;
}

// ============================================================================
// Workflow Definition Types
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version?: string;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  metadata?: {
    author?: string;
    tags?: string[];
    category?: string;
  };
}
