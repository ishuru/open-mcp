#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "url";
import * as path from "path";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import tool registrations
import { registerFileTools } from "./tools/file-tools.js";
import { registerWebTools } from "./tools/web-tools.js";
import { registerDevTools } from "./tools/dev-tools.js";
import { registerSummarizeTool } from "./tools/summarize-tool.js";

// Import utilities
import { setAllowedDirectories, getAllowedDirectories } from "./utils/path-validation.js";

// Import new modular components
import { registry } from "./core/registry.js";
import { registerPromptTools } from "./prompts/prompts.js";
import { registerSkillTools, registerAllSkills } from "./skills/skills.js";
import { registerWorkflowTools, registerAllWorkflows } from "./workflows/workflows.js";

// Parse command-line arguments for allowed directories
const args = process.argv.slice(2);
if (args.length > 0) {
    setAllowedDirectories(args);
    console.error(`Allowed directories:`, args);
}

// Create MCP server
const server = new McpServer({
    name: "open-mcp",
    version: "3.0.0"
});

// Initialize the registry and load all components
async function initializeComponents() {
    // Get the prompts directory path
    const promptsDir = path.resolve(__dirname, "../prompts");

    // Initialize registry with prompts, skills, and workflows
    await registry.initialize({
        promptsDir,
    });

    // Register all skills with the registry
    registerAllSkills();

    // Register all workflows with the registry
    registerAllWorkflows();

    // Register existing tools with the registry for use in skills/workflows
    const toolMap = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();

    // We'll register tool handlers after the tool registration functions are called
    // This is a simplified approach - in production, you'd want a more robust bridge
    return toolMap;
}

// Register all tool categories
registerFileTools(server);
registerWebTools(server);
registerDevTools(server);
registerSummarizeTool(server);

// Register new modular components
registerPromptTools(server);
registerSkillTools(server);
registerWorkflowTools(server);

// Add greeting resource
server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async (uri, { name }) => ({
        contents: [{
            uri: uri.href,
            text: `Hello, ${name}! Welcome to Open MCP Server v2.0.0.`
        }]
    })
);

// Add server-info resource
server.resource(
    "server-info",
    "server-info://",
    async () => {
        const stats = registry.getStats();
        return {
            contents: [{
                uri: "server-info://",
                text: JSON.stringify({
                    name: "Open MCP Server",
                    version: "3.0.0",
                    description: "Modular MCP server with prompts, skills, and workflows",
                    allowedDirectories: getAllowedDirectories(),
                    components: {
                        tools: {
                            file: ["read_file", "write_file", "list_directory", "search_files"],
                            web: ["fetch_url", "scrape_html"],
                            dev: ["git_status", "git_log", "git_diff", "system_info", "get_time"],
                            ai: ["summarize"]
                        },
                        prompts: stats.prompts,
                        skills: stats.skills,
                        workflows: stats.workflows
                    },
                    stats
                }, null, 2)
            }]
        };
    }
);

// Start server
async function main() {
    // Initialize all components
    await initializeComponents();

    // Connect to transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Open MCP Server v3.0.0 running on stdio");

    const stats = registry.getStats();
    console.error(`Loaded: ${stats.prompts} prompts, ${stats.skills} skills, ${stats.workflows} workflows`);
}

main().catch((error) => {
    console.error("Fatal server error:", error);
    process.exit(1);
});
