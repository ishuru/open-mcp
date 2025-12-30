/**
 * Code Review Workflow
 * Automated code review and analysis workflow
 */

import { Workflow } from "../../types/workflows.js";

export const codeReview: Workflow = {
  id: "code_review_workflow",
  name: "Code Review Workflow",
  description: "Review code changes with git diff and analysis",
  steps: [
    {
      id: "get_diff",
      type: "tool",
      name: "Get Git Diff",
      config: {
        tool: "git_diff",
        parameters: {
          staged: false,
        },
      },
    },
    {
      id: "has_changes",
      type: "condition",
      name: "Check for Changes",
      config: {
        condition: "${result.get_diff} !== undefined",
        then: [
          {
            id: "analyze_diff",
            type: "prompt",
            name: "Analyze Changes",
            config: {
              prompt: "code_review",
              parameters: {
                code: "${result.get_diff}",
                focus: "error handling and best practices",
              },
            },
          },
        ],
        else: [
          {
            id: "no_changes",
            type: "tool",
            name: "No Changes",
            config: {
              tool: "get_time",
              parameters: {
                format: "iso",
              },
            },
          },
        ],
      },
    },
  ],
};

export const stagedChangesReview: Workflow = {
  id: "staged_changes_review",
  name: "Staged Changes Review",
  description: "Review staged changes before committing",
  steps: [
    {
      id: "git_status",
      type: "tool",
      name: "Git Status",
      config: {
        tool: "git_status",
        parameters: {},
      },
    },
    {
      id: "get_staged_diff",
      type: "tool",
      name: "Get Staged Diff",
      config: {
        tool: "git_diff",
        parameters: {
          staged: true,
        },
      },
    },
    {
      id: "review_staged",
      type: "prompt",
      name: "Review Staged Changes",
      runCondition: "${result.get_staged_diff} !== undefined",
      config: {
        prompt: "code_review",
        parameters: {
          diff: "${result.get_staged_diff}",
          focus: "bugs, security, and best practices",
        },
      },
      onError: "continue",
    },
  ],
};

export const refactorAnalysis: Workflow = {
  id: "refactor_analysis",
  name: "Refactoring Analysis",
  description: "Analyze code for refactoring opportunities",
  steps: [
    {
      id: "get_changes",
      type: "tool",
      name: "Get Changes",
      config: {
        tool: "git_diff",
        parameters: {},
      },
    },
    {
      id: "analyze_refactor",
      type: "prompt",
      name: "Analyze Refactoring",
      runCondition: "${result.get_changes} !== undefined",
      config: {
        prompt: "refactor_guide",
        parameters: {
          code: "${result.get_changes}",
          goals: "improve readability and maintainability",
        },
      },
      onError: "continue",
    },
  ],
};
