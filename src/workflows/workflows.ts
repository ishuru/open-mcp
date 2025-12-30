/**
 * Workflows Registry
 * Central export for all workflows and MCP integration
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registry } from "../core/registry.js";
import {
  dailyRoutine,
  morningBriefing,
  endOfDayReview,
} from "./definitions/daily-routine.js";
import {
  codeReview,
  stagedChangesReview,
  refactorAnalysis,
} from "./definitions/code-review.js";
import {
  quickProjectSetup,
  mcpProjectSetup,
  documentationSetup,
} from "./definitions/project-setup.js";

// ============================================================================
// Register all workflows with the registry
// ============================================================================

/**
 * Register all workflows with the central registry
 * This should be called during initialization
 */
export function registerAllWorkflows(): void {
  // Daily routine workflows
  registry.registerWorkflow(dailyRoutine);
  registry.registerWorkflow(morningBriefing);
  registry.registerWorkflow(endOfDayReview);

  // Code review workflows
  registry.registerWorkflow(codeReview);
  registry.registerWorkflow(stagedChangesReview);
  registry.registerWorkflow(refactorAnalysis);

  // Project setup workflows
  registry.registerWorkflow(quickProjectSetup);
  registry.registerWorkflow(mcpProjectSetup);
  registry.registerWorkflow(documentationSetup);
}

// ============================================================================
// MCP Integration - Register workflows
// ============================================================================

/**
 * Register all workflows as MCP tools
 */
export function registerWorkflowTools(server: McpServer): void {
  // Add a resource to list all workflows
  server.resource("workflows", "workflows://", async () => {
    const workflows = registry.getAllWorkflows();
    const byCategory = workflows.reduce(
      (acc, workflow) => {
        // Determine category from workflow ID
        const category = workflow.id.includes("routine") || workflow.id.includes("briefing") || workflow.id.includes("review")
          ? "productivity"
          : workflow.id.includes("code") || workflow.id.includes("refactor")
          ? "code-review"
          : workflow.id.includes("setup") || workflow.id.includes("project")
          ? "project-setup"
          : "general";

        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps.length,
        });
        return acc;
      },
      {} as Record<string, Array<{ id: string; name: string; description: string; steps: number }>>
    );

    return {
      contents: [
        {
          uri: "workflows://",
          text: JSON.stringify(
            {
              total: workflows.length,
              categories: Object.keys(byCategory),
              workflows: byCategory,
            },
            null,
            2
          ),
        },
      ],
    };
  });

  // Add individual workflow resources
  server.resource(
    "workflow",
    new ResourceTemplate("workflow://{id}", { list: undefined }),
    async (uri, { id }) => {
      const workflow = registry.getWorkflow(typeof id === "string" ? id : id[0]);
      if (!workflow) {
        throw new Error(`Workflow not found: ${id}`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                steps: workflow.steps.map((s) => ({
                  id: s.id,
                  type: s.type,
                  name: s.name,
                })),
                variables: workflow.variables,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Generic workflow execution tool
  server.tool(
    "execute_workflow",
    "Execute a workflow by ID with optional variables",
    {
      workflowId: z.string().describe("The ID of the workflow to execute"),
      variables: z.record(z.any()).optional().describe("Variables to pass to the workflow"),
    },
    async (args) => {
      try {
        const workflow = registry.getWorkflow(args.workflowId);
        if (!workflow) {
          return {
            content: [
              {
                type: "text",
                text: `Workflow not found: ${args.workflowId}`,
              },
            ],
            isError: true,
          };
        }

        const result = await registry.workflowEngine.execute(workflow, args.variables);

        if (result.success) {
          // Format the results for display
          const stepsSummary = Array.from(result.results.entries()).map(([stepId, stepResult]) => ({
            stepId,
            success: stepResult.success,
            error: stepResult.error,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    workflow: workflow.name,
                    success: true,
                    duration: result.duration,
                    variables: result.variables,
                    steps: stepsSummary,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    workflow: workflow.name,
                    success: false,
                    error: result.error,
                    duration: result.duration,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ============================================================================
// Exports
// ============================================================================

export const allWorkflows = {
  productivity: {
    dailyRoutine,
    morningBriefing,
    endOfDayReview,
  },
  "code-review": {
    codeReview,
    stagedChangesReview,
    refactorAnalysis,
  },
  "project-setup": {
    quickProjectSetup,
    mcpProjectSetup,
    documentationSetup,
  },
};
