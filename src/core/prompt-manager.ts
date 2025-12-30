/**
 * Prompt Manager
 * Manages prompt template registration, loading, and rendering
 */

import Handlebars from "handlebars";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "js-yaml";
import {
  PromptTemplate,
  PromptTemplateConfig,
  RenderedPrompt,
  PromptCategory,
} from "../types/prompts.js";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate required parameters are present
 */
function validateParameters(
  template: PromptTemplate,
  params: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const required = template.parameters.filter((p) => p.required);
  const missing = required.filter((p) => !(p.name in params));
  return {
    valid: missing.length === 0,
    missing: missing.map((p) => p.name),
  };
}

/**
 * Apply default values to parameters
 */
function applyDefaults(
  template: PromptTemplate,
  params: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...params };
  for (const param of template.parameters) {
    if (!(param.name in result) && param.default !== undefined) {
      result[param.name] = param.default;
    }
  }
  return result;
}

// ============================================================================
// PromptManager Class
// ============================================================================

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();

    // Register custom helpers
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper: capitalize first letter
    this.handlebars.registerHelper("capitalize", (str: string) => {
      if (typeof str !== "string") return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Helper: lowercase
    this.handlebars.registerHelper("lowercase", (str: string) => {
      if (typeof str !== "string") return str;
      return str.toLowerCase();
    });

    // Helper: uppercase
    this.handlebars.registerHelper("uppercase", (str: string) => {
      if (typeof str !== "string") return str;
      return str.toUpperCase();
    });

    // Helper: join array
    this.handlebars.registerHelper("join", (arr: unknown[], sep = ", ") => {
      if (!Array.isArray(arr)) return arr;
      return arr.join(sep);
    });

    // Helper: length
    this.handlebars.registerHelper("length", (arr: unknown[] | string) => {
      if (Array.isArray(arr)) return arr.length;
      if (typeof arr === "string") return arr.length;
      return 0;
    });

    // Helper: equals
    this.handlebars.registerHelper("eq", (a: unknown, b: unknown) => {
      return a === b;
    });

    // Helper: not equals
    this.handlebars.registerHelper("ne", (a: unknown, b: unknown) => {
      return a !== b;
    });

    // Helper: json stringify
    this.handlebars.registerHelper("json", (obj: unknown) => {
      return JSON.stringify(obj, null, 2);
    });
  }

  /**
   * Load templates from a directory containing YAML files
   */
  async loadFromDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively load from subdirectories
          await this.loadFromDirectory(fullPath);
        } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
          // Load YAML file
          const content = await fs.readFile(fullPath, "utf-8");
          const config = yaml.load(content) as PromptTemplateConfig;

          if (this.isValidTemplateConfig(config)) {
            this.registerFromConfig(config);
          } else {
            console.error(`Invalid template config in ${fullPath}`);
          }
        }
      }
    } catch (error) {
      // Directory might not exist, which is okay
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * Validate template config structure
   */
  private isValidTemplateConfig(config: unknown): config is PromptTemplateConfig {
    if (typeof config !== "object" || config === null) return false;
    const c = config as Record<string, unknown>;
    return (
      typeof c.id === "string" &&
      typeof c.name === "string" &&
      typeof c.description === "string" &&
      typeof c.template === "string" &&
      Array.isArray(c.parameters)
    );
  }

  /**
   * Register a template from config
   */
  registerFromConfig(config: PromptTemplateConfig): void {
    const template: PromptTemplate = {
      id: config.id,
      name: config.name,
      description: config.description,
      category: config.category,
      template: config.template,
      parameters: config.parameters,
      examples: config.examples,
      tags: config.tags,
    };
    this.register(template);
  }

  /**
   * Register a prompt template programmatically
   */
  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  get(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List all templates, optionally filtered by category
   */
  list(category?: PromptCategory): PromptTemplate[] {
    const all = Array.from(this.templates.values());
    if (category) {
      return all.filter((t) => t.category === category);
    }
    return all;
  }

  /**
   * Search templates by query (searches name, description, tags)
   */
  search(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Render a template with the given parameters
   */
  render(templateId: string, params: Record<string, unknown>): RenderedPrompt {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required parameters
    const validation = validateParameters(template, params);
    if (!validation.valid) {
      throw new Error(
        `Missing required parameters: ${validation.missing.join(", ")}`
      );
    }

    // Apply defaults
    const finalParams = applyDefaults(template, params);

    // Compile and render template
    const compiledTemplate = this.handlebars.compile(template.template);
    const content = compiledTemplate(finalParams);

    return {
      templateId,
      content,
      parameters: finalParams,
    };
  }

  /**
   * Validate parameters against a template without rendering
   */
  validate(
    templateId: string,
    params: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const template = this.get(templateId);
    if (!template) {
      return { valid: false, errors: [`Template not found: ${templateId}`] };
    }

    const paramValidation = validateParameters(template, params);
    if (!paramValidation.valid) {
      return {
        valid: false,
        errors: [`Missing required parameters: ${paramValidation.missing.join(", ")}`],
      };
    }

    // Type validation
    const errors: string[] = [];
    for (const param of template.parameters) {
      const value = params[param.name];
      if (value !== undefined && !this.validateType(value, param.type)) {
        errors.push(
          `Parameter '${param.name}' should be type '${param.type}', got '${typeof value}'`
        );
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
   * Get all categories
   */
  getCategories(): PromptCategory[] {
    const categories = new Set<PromptCategory>();
    for (const template of this.templates.values()) {
      categories.add(template.category);
    }
    return Array.from(categories);
  }

  /**
   * Unregister a template
   */
  unregister(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }

  /**
   * Get the count of registered templates
   */
  get count(): number {
    return this.templates.size;
  }
}
