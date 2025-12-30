/**
 * Productivity-related Skills
 * Skills for daily productivity and task management
 */

import { Skill } from "../../types/skills.js";

// ============================================================================
// Productivity Skills
// ============================================================================

export const dailyBriefing: Skill = {
  id: "daily_briefing",
  name: "Daily Briefing",
  description: "Get a daily briefing with time, git status, and system info",
  category: "productivity",
  tools: [
    {
      tool: "get_time",
      name: "time",
      parameters: {
        format: "iso",
        timezone: "${input.timezone}",
      },
    },
    {
      tool: "git_status",
      name: "gitStatus",
      parameters: {},
    },
    {
      tool: "system_info",
      name: "systemInfo",
      parameters: {
        category: "platform",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "Timezone for time display",
      },
    },
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Daily briefing information",
    properties: {
      time: { type: "object" },
      gitStatus: { type: "object" },
      systemInfo: { type: "object" },
    },
  },
};

export const projectStatus: Skill = {
  id: "project_status",
  name: "Project Status Report",
  description: "Get comprehensive project status with git log and recent changes",
  category: "productivity",
  tools: [
    {
      tool: "git_status",
      name: "status",
      parameters: {},
    },
    {
      tool: "git_log",
      name: "log",
      parameters: {
        maxCount: 10,
      },
    },
    {
      tool: "get_time",
      name: "time",
      parameters: {
        format: "iso",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      maxCommits: {
        type: "number",
        description: "Maximum number of commits to show",
        default: 10,
      },
    },
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Project status report",
    properties: {
      status: { type: "object" },
      recentCommits: { type: "array" },
      timestamp: { type: "string" },
    },
  },
};

export const workspaceOverview: Skill = {
  id: "workspace_overview",
  name: "Workspace Overview",
  description: "Get an overview of the current workspace directory",
  category: "productivity",
  tools: [
    {
      tool: "list_directory",
      name: "listDir",
      parameters: {
        path: "${input.path}",
        recursive: false,
      },
    },
    {
      tool: "git_status",
      name: "gitStatus",
      parameters: {},
      optional: true,
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the workspace directory",
        default: ".",
      },
    },
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Workspace overview",
    properties: {
      files: { type: "array" },
      gitStatus: { type: "object" },
    },
  },
};

export const quickSummary: Skill = {
  id: "quick_summary",
  name: "Quick Summary",
  description: "Get a quick summary of current state (time, memory, git)",
  category: "productivity",
  tools: [
    {
      tool: "get_time",
      name: "time",
      parameters: {
        format: "locale",
      },
    },
    {
      tool: "system_info",
      name: "memory",
      parameters: {
        category: "memory",
      },
    },
    {
      tool: "git_status",
      name: "git",
      parameters: {},
      optional: true,
    },
  ],
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  outputSchema: {
    type: "object",
    description: "Quick summary",
    properties: {
      time: { type: "string" },
      memory: { type: "object" },
      git: { type: "object" },
    },
  },
};

// ============================================================================
// Skill Exports
// ============================================================================

export const productivitySkills = [
  dailyBriefing,
  projectStatus,
  workspaceOverview,
  quickSummary,
];
