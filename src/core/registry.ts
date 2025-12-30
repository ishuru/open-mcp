/**
 * Central Registry
 * Manages all prompts, skills, workflows, and their executors
 */

import { PromptManager } from "./prompt-manager.js";
import { SkillExecutor, McpToolExecutor } from "./skill-executor.js";
import { WorkflowEngine } from "./workflow-engine.js";
import { Skill } from "../types/skills.js";
import { Workflow } from "../types/workflows.js";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Registry Class
// ============================================================================

export class Registry {
  // Singleton instance
  private static instance: Registry;

  // Core components
  public prompts: PromptManager;
  public skillExecutor: SkillExecutor;
  public workflowEngine: WorkflowEngine;
  private toolExecutor: McpToolExecutor;

  // Registrations
  private skills: Map<string, Skill> = new Map();
  private workflows: Map<string, Workflow> = new Map();

  // Initialization state
  private initialized: boolean = false;

  private constructor() {
    this.toolExecutor = new McpToolExecutor();
    this.skillExecutor = new SkillExecutor(this.toolExecutor);
    this.workflowEngine = new WorkflowEngine(
      this.toolExecutor,
      this.skillExecutor,
      this, // Registry implements PromptExecutor
      this.skills // Pass skills registry
    );
    this.prompts = new PromptManager();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Initialize all components
   */
  async initialize(options?: {
    promptsDir?: string;
    skills?: Skill[];
    workflows?: Workflow[];
  }): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load prompts from directory if provided
    if (options?.promptsDir) {
      await this.prompts.loadFromDirectory(options.promptsDir);
    } else {
      // Try default prompts directory
      const defaultPromptsDir = this.getDefaultPromptsDir();
      if (defaultPromptsDir) {
        await this.prompts.loadFromDirectory(defaultPromptsDir);
      }
    }

    // Register skills if provided
    if (options?.skills) {
      for (const skill of options.skills) {
        this.registerSkill(skill);
      }
    }

    // Register workflows if provided
    if (options?.workflows) {
      for (const workflow of options.workflows) {
        this.registerWorkflow(workflow);
      }
    }

    this.initialized = true;
  }

  /**
   * Get the default prompts directory
   */
  private getDefaultPromptsDir(): string | null {
    try {
      return path.resolve(__dirname, "../../prompts");
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Tool Registration (for bridging with MCP server)
  // ============================================================================

  /**
   * Register a tool handler for use by skills and workflows
   */
  registerToolHandler(
    toolName: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.toolExecutor.registerTool(toolName, handler);
  }

  /**
   * Get the tool executor (for MCP server to register its tools)
   */
  getToolExecutor(): McpToolExecutor {
    return this.toolExecutor;
  }

  // ============================================================================
  // Skill Management
  // ============================================================================

  /**
   * Register a skill
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  /**
   * Get a skill by ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: string): Skill[] {
    return this.getAllSkills().filter((s) => s.category === category);
  }

  /**
   * List all skill categories
   */
  getSkillCategories(): string[] {
    const categories = new Set<string>();
    for (const skill of this.skills.values()) {
      categories.add(skill.category);
    }
    return Array.from(categories);
  }

  /**
   * Unregister a skill
   */
  unregisterSkill(id: string): boolean {
    return this.skills.delete(id);
  }

  // ============================================================================
  // Workflow Management
  // ============================================================================

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Get a workflow by ID
   */
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Unregister a workflow
   */
  unregisterWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  // ============================================================================
  // Prompt Executor Interface Implementation
  // ============================================================================

  /**
   * Render a prompt (implements PromptExecutor interface)
   */
  async renderPrompt(
    promptId: string,
    parameters: Record<string, unknown>
  ): Promise<string> {
    const rendered = this.prompts.render(promptId, parameters);
    return rendered.content;
  }

  // ============================================================================
  // Statistics and Info
  // ============================================================================

  /**
   * Get registry statistics
   */
  getStats(): {
    prompts: number;
    skills: number;
    workflows: number;
    tools: number;
    initialized: boolean;
  } {
    return {
      prompts: this.prompts.count,
      skills: this.skills.size,
      workflows: this.workflows.size,
      tools: this.toolExecutor.getToolNames().length,
      initialized: this.initialized,
    };
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset the registry (clear all registrations)
   */
  reset(): void {
    this.prompts.clear();
    this.skills.clear();
    this.workflows.clear();
    this.initialized = false;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const registry = Registry.getInstance();
