/**
 * Prompt-related type definitions for the Modular MCP Server
 * Defines the structure for reusable prompt templates
 */

// ============================================================================
// Prompt Category Types
// ============================================================================

export type PromptCategory = "productivity" | "code" | "research" | "communication" | "general";

// ============================================================================
// Prompt Template Types
// ============================================================================

export interface PromptTemplate {
  /** Unique identifier for the prompt template */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the prompt does */
  description: string;
  /** Category for organization */
  category: PromptCategory;
  /** The template content (supports Handlebars syntax) */
  template: string;
  /** Parameters that can be used in the template */
  parameters: PromptParameter[];
  /** Optional examples of how to use the prompt */
  examples?: PromptExample[];
  /** Optional tags for search/discovery */
  tags?: string[];
}

export interface PromptParameter {
  /** Parameter name (used in template as {{name}}) */
  name: string;
  /** Parameter type */
  type: "string" | "number" | "boolean" | "array" | "object";
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value if not provided */
  default?: unknown;
}

export interface PromptExample {
  /** Example input parameters */
  inputs: Record<string, unknown>;
  /** Example output */
  output: string;
}

// ============================================================================
// Render Types
// ============================================================================

export interface RenderedPrompt {
  /** ID of the template that was rendered */
  templateId: string;
  /** The rendered prompt content */
  content: string;
  /** Parameters used for rendering */
  parameters: Record<string, unknown>;
}

// ============================================================================
// YAML Config Types (for loading from files)
// ============================================================================

export interface PromptTemplateConfig {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  template: string;
  parameters: PromptParameterConfig[];
  examples?: PromptExampleConfig[];
  tags?: string[];
}

export interface PromptParameterConfig {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
}

export interface PromptExampleConfig {
  inputs: Record<string, unknown>;
  output: string;
}
