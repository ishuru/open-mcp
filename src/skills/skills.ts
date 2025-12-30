/**
 * Skills Registry
 * Central export for all skills and registration function
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registry } from "../core/registry.js";
import { documentSkills } from "./categories/document.js";
import { developmentSkills } from "./categories/development.js";
import { productivitySkills } from "./categories/productivity.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// ============================================================================
// Register all skills with the registry
// ============================================================================

/**
 * Register all skills with the central registry
 * This should be called during initialization
 */
export function registerAllSkills(): void {
  // Document skills
  for (const skill of documentSkills) {
    registry.registerSkill(skill);
  }

  // Development skills
  for (const skill of developmentSkills) {
    registry.registerSkill(skill);
  }

  // Productivity skills
  for (const skill of productivitySkills) {
    registry.registerSkill(skill);
  }
}

// ============================================================================
// MCP Integration - Register skills as tools
// ============================================================================

/**
 * Register all skills as MCP tools
 * Each skill becomes a callable tool
 */
export function registerSkillTools(server: McpServer): void {
  // Add a resource to list all skills
  server.resource("skills", "skills://", async () => {
    const skills = registry.getAllSkills();
    const byCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      });
      return acc;
    }, {} as Record<string, Array<{ id: string; name: string; description: string }>>);

    return {
      contents: [
        {
          uri: "skills://",
          text: JSON.stringify(
            {
              total: skills.length,
              categories: Object.keys(byCategory),
              skills: byCategory,
            },
            null,
            2
          ),
        },
      ],
    };
  });

  // Add individual skill resources
  server.resource(
    "skill",
    new ResourceTemplate("skill://{id}", { list: undefined }),
    async (uri, { id }) => {
      const skill = registry.getSkill(typeof id === "string" ? id : id[0]);
      if (!skill) {
        throw new Error(`Skill not found: ${id}`);
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                category: skill.category,
                tools: skill.tools.map((t) => ({ tool: t.tool, name: t.name })),
                inputSchema: skill.inputSchema,
                outputSchema: skill.outputSchema,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Register each skill as a tool
  for (const skill of registry.getAllSkills()) {
    // Convert inputSchema to Zod schema
    const zodSchema = convertJsonSchemaToZod(skill.inputSchema);

    server.tool(
      skill.id,
      skill.description,
      zodSchema,
      async (args) => {
        try {
          // Execute the skill using the registry's skill executor
          const result = await registry.skillExecutor.execute(skill, args);

          if (result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      output: result.output,
                      steps: result.steps.map((s) => ({
                        name: s.name,
                        success: s.success,
                        error: s.error,
                      })),
                      duration: result.duration,
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
                      success: false,
                      error: result.error,
                      steps: result.steps,
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
                text: `Error executing skill ${skill.id}: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert JSON Schema to Zod Raw Shape (for MCP tool registration)
 * This returns a ZodRawShape which is an object with property names mapped to Zod types
 */
function convertJsonSchemaToZod(
  jsonSchema: { type: string; properties?: Record<string, { type: string; description?: string }>; required?: string[] }
): z.ZodRawShape {
  if (jsonSchema.type === "object" && jsonSchema.properties) {
    const shape: z.ZodRawShape = {};
    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      let zodType = getZodType(prop.type);
      // Make optional if not in required array
      if (!jsonSchema.required?.includes(key)) {
        zodType = zodType.optional();
      }
      shape[key] = zodType;
    }
    return shape;
  }

  return {};
}

/**
 * Get Zod type from JSON schema type
 */
function getZodType(type: string): z.ZodTypeAny {
  switch (type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(z.any());
    case "object":
      return z.record(z.any());
    default:
      return z.any();
  }
}

// ============================================================================
// Exports
// ============================================================================

export const allSkills = {
  document: documentSkills,
  development: developmentSkills,
  productivity: productivitySkills,
};

export { documentSkills, developmentSkills, productivitySkills };
