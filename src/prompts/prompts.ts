/**
 * Prompts MCP Integration
 * Exposes prompts as MCP resources and tools
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registry } from "../core/registry.js";
import { PromptCategory } from "../types/prompts.js";

// ============================================================================
// MCP Integration
// ============================================================================

/**
 * Register prompt-related MCP tools and resources
 */
export function registerPromptTools(server: McpServer): void {
  // List all prompts as a resource
  server.resource("prompts", "prompts://", async () => {
    const prompts = registry.prompts.list();
    const byCategory = prompts.reduce(
      (acc, prompt) => {
        if (!acc[prompt.category]) {
          acc[prompt.category] = [];
        }
        acc[prompt.category].push({
          id: prompt.id,
          name: prompt.name,
          description: prompt.description,
          parameters: prompt.parameters.length,
          tags: prompt.tags || [],
        });
        return acc;
      },
      {} as Record<
        PromptCategory,
        Array<{ id: string; name: string; description: string; parameters: number; tags: string[] }>
      >
    );

    return {
      contents: [
        {
          uri: "prompts://",
          text: JSON.stringify(
            {
              total: prompts.length,
              categories: registry.prompts.getCategories(),
              prompts: byCategory,
            },
            null,
            2
          ),
        },
      ],
    };
  });

  // List prompts by category as a resource
  server.resource(
    "prompts_by_category",
    new ResourceTemplate("prompts://{category}", { list: undefined }),
    async (uri, { category }) => {
      const prompts = registry.prompts.list(category as PromptCategory);

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                category,
                count: prompts.length,
                prompts: prompts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  parameters: p.parameters.map((param) => ({
                    name: param.name,
                    type: param.type,
                    required: param.required,
                    description: param.description,
                  })),
                  examples: p.examples,
                  tags: p.tags,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Get a specific prompt template as a resource
  server.resource(
    "prompt",
    new ResourceTemplate("prompt://{id}", { list: undefined }),
    async (uri, { id }) => {
      const prompt = registry.prompts.get(typeof id === "string" ? id : id[0]);
      if (!prompt) {
        throw new Error(`Prompt not found: ${id}`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                id: prompt.id,
                name: prompt.name,
                description: prompt.description,
                category: prompt.category,
                template: prompt.template,
                parameters: prompt.parameters,
                examples: prompt.examples,
                tags: prompt.tags,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: List all prompts
  server.tool(
    "list_prompts",
    "List all available prompt templates, optionally filtered by category",
    {
      category: z
        .enum(["productivity", "code", "research", "communication", "general"])
        .optional()
        .describe("Filter by category"),
    },
    async (args) => {
      const prompts = registry.prompts.list(args.category as PromptCategory);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: prompts.length,
                prompts: prompts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  category: p.category,
                  parameters: p.parameters.length,
                  tags: p.tags,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: Search prompts
  server.tool(
    "search_prompts",
    "Search for prompt templates by query string",
    {
      query: z.string().describe("Search query"),
    },
    async (args) => {
      const prompts = registry.prompts.search(args.query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query: args.query,
                count: prompts.length,
                results: prompts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  category: p.category,
                  tags: p.tags,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: Get prompt template
  server.tool(
    "get_prompt",
    "Get a prompt template by ID with its parameters and examples",
    {
      id: z.string().describe("Prompt template ID"),
    },
    async (args) => {
      const prompt = registry.prompts.get(args.id);
      if (!prompt) {
        return {
          content: [
            {
              type: "text",
              text: `Prompt not found: ${args.id}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: prompt.id,
                name: prompt.name,
                description: prompt.description,
                category: prompt.category,
                parameters: prompt.parameters,
                examples: prompt.examples,
                tags: prompt.tags,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool: Render prompt
  server.tool(
    "render_prompt",
    "Render a prompt template with the given parameters",
    {
      templateId: z.string().describe("The ID of the template to render"),
      parameters: z.record(z.any()).describe("Parameters for the template"),
    },
    async (args) => {
      try {
        const rendered = registry.prompts.render(args.templateId, args.parameters);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  templateId: rendered.templateId,
                  content: rendered.content,
                  parameters: rendered.parameters,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error rendering prompt: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Validate prompt parameters
  server.tool(
    "validate_prompt",
    "Validate parameters against a prompt template without rendering",
    {
      templateId: z.string().describe("The ID of the template"),
      parameters: z.record(z.any()).describe("Parameters to validate"),
    },
    async (args) => {
      const validation = registry.prompts.validate(args.templateId, args.parameters);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(validation, null, 2),
          },
        ],
      };
    }
  );

  // Tool: Get prompt categories
  server.tool("get_prompt_categories", "Get all available prompt categories", {}, async () => {
    const categories = registry.prompts.getCategories();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              categories,
              count: categories.length,
            },
            null,
            2
          ),
        },
      ],
    };
  });
}

// ============================================================================
// Predefined Prompt Categories (for reference)
// ============================================================================

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "productivity",
  "code",
  "research",
  "communication",
  "general",
];

export const DEFAULT_PROMPTS = {
  productivity: ["daily_planner", "task_prioritizer"],
  code: ["code_review", "refactor_guide"],
  research: ["topic_explorer", "summarizer"],
};
