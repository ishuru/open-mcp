# Open MCP Server

A modular Model Context Protocol (MCP) server with **Prompts**, **Skills**, and **Workflows** for personal productivity automation.

## Features

### Core Components
- **6 Prompt Templates** - Reusable, parameterizable prompts for common tasks
- **11 Skills** - Pre-defined task sequences that compose multiple tools
- **9 Workflows** - Multi-step automation pipelines with conditionals and loops
- **15+ Tools** - File operations, web scraping, git operations, system info, and AI summarization

### Categories
- **Productivity**: Daily planning, task prioritization, briefings
- **Development**: Code review, project setup, refactoring guidance
- **Research**: Topic exploration, document summarization
- **Document**: File analysis, text summarization, word counting

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Server Resources

| Resource | Description |
|----------|-------------|
| `prompts://` | List all prompt templates |
| `prompt://{id}` | Get specific prompt template |
| `skills://` | List all available skills |
| `skill://{id}` | Get specific skill details |
| `workflows://` | List all workflows |
| `workflow://{id}` | Get specific workflow details |
| `server-info://` | Server statistics and capabilities |

## Available Tools

### Prompt Management
- `list_prompts` - List all prompts (optional category filter)
- `search_prompts` - Search prompts by query string
- `get_prompt` - Get prompt template with parameters
- `render_prompt` - Render a prompt with parameters
- `validate_prompt` - Validate prompt parameters
- `get_prompt_categories` - List all prompt categories

### Skills (as Tools)
- `summarize_document` - Read and summarize a file
- `analyze_text` - Read and analyze text
- `setup_project` - Initialize a new project
- `daily_briefing` - Get daily productivity briefing
- `project_status` - Get project status report
- And 6 more...

### Workflow Execution
- `execute_workflow` - Execute a workflow by ID with variables

### Original Tools
- **File**: `read_file`, `write_file`, `list_directory`, `search_files`
- **Web**: `fetch_url`, `scrape_html`
- **Dev**: `git_status`, `git_log`, `git_diff`, `system_info`, `get_time`
- **AI**: `summarize`

## Configuration

### Command-line Arguments
```bash
node dist/index.js /path/to/workspace /home/user/documents
```

### Environment Variables
- `GOOGLE_GENERATIVE_AI_API_KEY` - Required for AI summarization features

## Usage with Conductor

Add this MCP server to Conductor:

```bash
claude mcp add open-mcp -s user -- node /Users/sdluffy/conductor/workspaces/playground/san-jose/open-mcp/dist/index.js
```

Or add to your `conductor.json`:

```json
{
  "mcpServers": {
    "open-mcp": {
      "command": "node",
      "args": ["/Users/sdluffy/conductor/workspaces/playground/san-jose/open-mcp/dist/index.js"]
    }
  }
}
```

## Project Structure

```
open-mcp/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── core/                    # Core engines
│   │   ├── prompt-manager.ts    # Prompt template management
│   │   ├── skill-executor.ts    # Skill execution engine
│   │   ├── workflow-engine.ts   # Workflow engine with conditionals
│   │   └── registry.ts          # Central component registry
│   ├── prompts/                 # Prompt templates (YAML)
│   │   ├── productivity/
│   │   ├── code/
│   │   └── research/
│   ├── skills/                  # Skill definitions
│   │   ├── categories/
│   │   │   ├── document.ts
│   │   │   ├── development.ts
│   │   │   └── productivity.ts
│   │   └── skills.ts            # Skill registry
│   ├── workflows/               # Workflow definitions
│   │   ├── definitions/
│   │   │   ├── daily-routine.ts
│   │   │   ├── code-review.ts
│   │   │   └── project-setup.ts
│   │   └── workflows.ts         # Workflow registry
│   ├── tools/                   # Original tools
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Utilities
└── prompts/                     # YAML prompt templates
```

## Forked Dependencies

We maintain forks of key dependencies for customization:

| Repository | Fork | Purpose |
|------------|------|---------|
| [@modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | [ishuru/typescript-sdk](https://github.com/ishuru/typescript-sdk) | MCP SDK modifications |
| [openai/openai-openapi](https://github.com/openai/openai-openapi) | [ishuru/openai-openapi](https://github.com/ishuru/openai-openapi) | OpenAI API spec |

### Contributing to Forks

1. Make changes in your fork
2. Open a PR to the upstream repository
3. Reference the open-mcp issue you're solving

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Run with output
npm run dev:full
```

### Adding New Prompts

Create a YAML file in `prompts/{category}/`:

```yaml
id: my_prompt
name: My Prompt
description: Description
category: productivity
template: |
  Your template here with {{variables}}
parameters:
  - name: variable
    type: string
    required: true
```

### Adding New Skills

Create a skill in `src/skills/categories/{category}.ts`:

```typescript
export const mySkill: Skill = {
  id: "my_skill",
  name: "My Skill",
  description: "Description",
  category: "my_category",
  tools: [
    { tool: "tool_name", parameters: {...} }
  ],
  inputSchema: { type: "object", properties: {...} },
  outputSchema: { type: "object", properties: {...} }
};
```

### Adding New Workflows

Create a workflow in `src/workflows/definitions/{name}.ts`:

```typescript
export const myWorkflow: Workflow = {
  id: "my_workflow",
  name: "My Workflow",
  description: "Description",
  steps: [
    { id: "step1", type: "tool", name: "Step 1", config: {...} }
  ]
};
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Client (Claude)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Server (stdio)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Tool Registry                          │  │
│  │  ┌───────────┐ ┌───────────┐ ┌─────────────────────┐     │  │
│  │  │  Prompts  │ │  Skills   │ │     Workflows       │     │  │
│  │  │ (Resource)│ │  (Tools)  │ │      (Tools)        │     │  │
│  │  └─────┬─────┘ └─────┬─────┘ └──────────┬──────────┘     │  │
│  └────────┼─────────────┼──────────────────┼─────────────────┘  │
│           │             │                  │                      │
│  ┌────────┼─────────────┼──────────────────┼─────────────────┐  │
│  │        ▼             ▼                  ▼                  │  │
│  │  ┌─────────┐ ┌─────────────┐ ┌──────────────────┐        │  │
│  │  │ Prompt  │ │   Skill     │ │   Workflow       │        │  │
│  │  │ Manager │ │  Executor   │ │    Engine        │        │  │
│  │  └────┬────┘ └──────┬──────┘ └────────┬─────────┘        │  │
│  │       │              │                  │                  │  │
│  │       ▼              ▼                  ▼                  │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │            Existing Tools                       │     │  │
│  │  │  file-tools | web-tools | dev-tools | ai-tools │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Security

- Path validation with allowed directories whitelist
- Command injection prevention
- Timeout protection on HTTP requests
- Directory traversal attack prevention

## License

MIT License - see [LICENSE](LICENSE) for details

## Links

- [MCP Specification](https://modelcontextprotocol.io)
- [Conductor Documentation](https://docs.conductor.build)
- [GitHub Repository](https://github.com/ishuru/open-mcp)
