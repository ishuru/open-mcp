/**
 * Daily Routine Workflow
 * Automated daily productivity routine
 */

import { Workflow } from "../../types/workflows.js";

export const dailyRoutine: Workflow = {
  id: "daily_routine",
  name: "Daily Routine",
  description: "Automated daily productivity routine - get time, check git status, and generate a plan",
  variables: {
    focusArea: "",
  },
  steps: [
    {
      id: "get_current_time",
      type: "tool",
      name: "Get Current Time",
      config: {
        tool: "get_time",
        parameters: {
          format: "iso",
        },
      },
    },
    {
      id: "check_git_status",
      type: "tool",
      name: "Check Git Status",
      config: {
        tool: "git_status",
        parameters: {},
      },
      onError: "continue",
    },
    {
      id: "get_system_info",
      type: "tool",
      name: "Get System Info",
      config: {
        tool: "system_info",
        parameters: {
          category: "platform",
        },
      },
      onError: "continue",
    },
    {
      id: "generate_summary",
      type: "tool",
      name: "Generate Daily Summary",
      runCondition: "${variables.focusArea} !== ''",
      config: {
        tool: "render_prompt",
        parameters: {
          templateId: "summarizer",
          parameters: {
            text: `Focus area for today: ${"${variables.focusArea}"}`,
            style: "concise",
          },
        },
      },
      onError: "continue",
    },
  ],
};

export const morningBriefing: Workflow = {
  id: "morning_briefing",
  name: "Morning Briefing",
  description: "Start your day with a comprehensive briefing including time, git status, and system info",
  steps: [
    {
      id: "time",
      type: "tool",
      name: "Get Time",
      config: {
        tool: "get_time",
        parameters: {
          format: "locale",
        },
      },
    },
    {
      id: "git",
      type: "tool",
      name: "Git Status",
      config: {
        tool: "git_status",
        parameters: {},
      },
      onError: "continue",
    },
    {
      id: "system",
      type: "tool",
      name: "System Status",
      config: {
        tool: "system_info",
        parameters: {
          category: "memory",
        },
      },
      onError: "continue",
    },
    {
      id: "recent_changes",
      type: "tool",
      name: "Recent Changes",
      runCondition: "${result.git} !== undefined",
      config: {
        tool: "git_log",
        parameters: {
          maxCount: 5,
        },
      },
      onError: "continue",
    },
  ],
};

export const endOfDayReview: Workflow = {
  id: "end_of_day_review",
  name: "End of Day Review",
  description: "Review your day with git status, recent commits, and a summary",
  steps: [
    {
      id: "time",
      type: "tool",
      name: "Get Time",
      config: {
        tool: "get_time",
        parameters: {
          format: "iso",
        },
      },
    },
    {
      id: "git_status",
      type: "tool",
      name: "Git Status",
      config: {
        tool: "git_status",
        parameters: {},
      },
      onError: "continue",
    },
    {
      id: "git_log",
      type: "tool",
      name: "Today's Commits",
      config: {
        tool: "git_log",
        parameters: {
          maxCount: 10,
        },
      },
      onError: "continue",
    },
    {
      id: "summary",
      type: "prompt",
      name: "Daily Summary",
      runCondition: "${result.git_log} !== undefined",
      config: {
        prompt: "summarizer",
        parameters: {
          text: "Review today's progress and plan for tomorrow.",
          style: "concise",
        },
      },
      onError: "continue",
    },
  ],
};
