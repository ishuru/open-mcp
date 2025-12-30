/**
 * Development-related Skills
 * Skills for development workflows and code management
 */

import { Skill } from "../../types/skills.js";

// ============================================================================
// Development Skills
// ============================================================================

export const setupProject: Skill = {
  id: "setup_project",
  name: "Setup New Project",
  description: "Initialize a new project with package.json, .gitignore, and README",
  category: "development",
  tools: [
    {
      tool: "write_file",
      name: "writePackageJson",
      parameters: {
        path: "${input.projectName}/package.json",
        content: "${input.packageJson}",
      },
    },
    {
      tool: "write_file",
      name: "writeGitignore",
      parameters: {
        path: "${input.projectName}/.gitignore",
        content: "${input.gitignore}",
      },
    },
    {
      tool: "write_file",
      name: "writeReadme",
      parameters: {
        path: "${input.projectName}/README.md",
        content: "${input.readme}",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "Name of the project",
      },
      packageJson: {
        type: "string",
        description: "Content for package.json",
      },
      gitignore: {
        type: "string",
        description: "Content for .gitignore",
      },
      readme: {
        type: "string",
        description: "Content for README.md",
      },
    },
    required: ["projectName", "packageJson", "gitignore", "readme"],
  },
  outputSchema: {
    type: "object",
    description: "Setup results",
    properties: {
      success: { type: "boolean" },
      files: { type: "array" },
    },
  },
};

export const getCodeChanges: Skill = {
  id: "get_code_changes",
  name: "Get Code Changes",
  description: "Get git diff and status for current changes",
  category: "development",
  tools: [
    {
      tool: "git_status",
      name: "status",
      parameters: {},
    },
    {
      tool: "git_diff",
      name: "diff",
      parameters: {
        staged: "${input.staged}",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      staged: {
        type: "boolean",
        description: "Get staged changes only",
        default: false,
      },
    },
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Git status and diff",
    properties: {
      status: { type: "object" },
      diff: { type: "string" },
    },
  },
};

export const reviewCurrentChanges: Skill = {
  id: "review_current_changes",
  name: "Review Current Changes",
  description: "Get current changes and summarize them",
  category: "development",
  tools: [
    {
      tool: "git_status",
      name: "status",
      parameters: {},
    },
    {
      tool: "git_diff",
      name: "diff",
      parameters: {},
    },
  ],
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Review results",
  },
};

export const searchCodebase: Skill = {
  id: "search_codebase",
  name: "Search Codebase",
  description: "Search for files matching a pattern",
  category: "development",
  tools: [
    {
      tool: "search_files",
      name: "search",
      parameters: {
        path: "${input.path}",
        pattern: "${input.pattern}",
        excludePatterns: "${input.excludePatterns}",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory to search in",
      },
      pattern: {
        type: "string",
        description: "Glob pattern to match",
      },
      excludePatterns: {
        type: "array",
        description: "Patterns to exclude",
      },
    },
    required: ["path", "pattern"],
  },
  outputSchema: {
    type: "object",
    description: "Search results",
    properties: {
      matches: { type: "array" },
      count: { type: "number" },
    },
  },
};

// ============================================================================
// Skill Exports
// ============================================================================

export const developmentSkills = [
  setupProject,
  getCodeChanges,
  reviewCurrentChanges,
  searchCodebase,
];
