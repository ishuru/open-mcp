/**
 * Project Setup Workflow
 * Automated project initialization workflow
 */

import { Workflow } from "../../types/workflows.js";

export const quickProjectSetup: Workflow = {
  id: "quick_project_setup",
  name: "Quick Project Setup",
  description: "Initialize a new TypeScript/Node.js project with common files",
  variables: {
    projectName: "",
    author: "",
    description: "",
  },
  steps: [
    {
      id: "validate_name",
      type: "condition",
      name: "Validate Project Name",
      config: {
        condition: "${variables.projectName} !== ''",
        then: [
          {
            id: "create_package_json",
            type: "tool",
            name: "Create package.json",
            config: {
              tool: "write_file",
              parameters: {
                path: "${variables.projectName}/package.json",
                content: `{
  "name": "${"${variables.projectName}"}",
  "version": "1.0.0",
  "description": "${"${variables.description}"}",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}`,
              },
            },
          },
          {
            id: "create_tsconfig",
            type: "tool",
            name: "Create tsconfig.json",
            config: {
              tool: "write_file",
              parameters: {
                path: "${variables.projectName}/tsconfig.json",
                content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
                "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
              },
            },
          },
          {
            id: "create_gitignore",
            type: "tool",
            name: "Create .gitignore",
            config: {
              tool: "write_file",
              parameters: {
                path: "${variables.projectName}/.gitignore",
                content: `node_modules/
dist/
.DS_Store
*.log
.env
.env.local`,
              },
            },
          },
          {
            id: "create_readme",
            type: "tool",
            name: "Create README.md",
            config: {
              tool: "write_file",
              parameters: {
                path: "${variables.projectName}/README.md",
                content: `# ${"${variables.projectName}"}

${"${variables.description}"}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run build
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\``,
              },
            },
          },
          {
            id: "create_src_dir",
            type: "tool",
            name: "Create src directory",
            config: {
              tool: "write_file",
              parameters: {
                path: "${variables.projectName}/src/index.ts",
                content: `console.log("Hello from ${"${variables.projectName}"}!");`,
              },
            },
          },
        ],
        else: [
          {
            id: "error_no_name",
            type: "tool",
            name: "Missing Project Name",
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

export const mcpProjectSetup: Workflow = {
  id: "mcp_project_setup",
  name: "MCP Project Setup",
  description: "Initialize a new MCP server project with proper structure",
  variables: {
    projectName: "",
    description: "An MCP server project",
  },
  steps: [
    {
      id: "setup",
      type: "skill",
      name: "Setup Project",
      config: {
        skill: "setup_project",
        inputs: {
          projectName: "${variables.projectName}",
          packageJson: `{
  "name": "${"${variables.projectName}"}",
  "version": "1.0.0",
  "description": "${"${variables.description}"}",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "${"${variables.projectName}"}": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}`,
          gitignore: `node_modules/
dist/
.DS_Store
*.log
.env`,
          readme: `# ${"${variables.projectName}"}

${"${variables.description}"}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run build
npm start
\`\`\`

## MCP Integration

Add to your Claude Desktop config:

\`\`\`json
{
  "mcpServers": {
    "${"${variables.projectName}"}": {
      "command": "node",
      "args": ["/path/to/${"${variables.projectName}"}/dist/index.js"]
    }
  }
}
\`\`\``,
        },
      },
    },
  ],
};

export const documentationSetup: Workflow = {
  id: "documentation_setup",
  name: "Documentation Setup",
  description: "Create documentation structure for a project",
  variables: {
    projectName: "My Project",
  },
  steps: [
    {
      id: "create_docs_dir",
      type: "tool",
      name: "Create docs directory",
      config: {
        tool: "write_file",
        parameters: {
          path: "docs/README.md",
          content: `# ${"${variables.projectName}"} Documentation

## Overview

This is the main documentation for ${"${variables.projectName}"}.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)

## Installation

TODO: Add installation instructions

## Usage

TODO: Add usage examples`,
        },
      },
    },
    {
      id: "create_api_docs",
      type: "tool",
      name: "Create API docs",
      config: {
        tool: "write_file",
        parameters: {
          path: "docs/API.md",
          content: `# API Reference

TODO: Document your API here

## Methods

### method1

Description of method1

**Parameters:**
- \`param1\` (type): Description

**Returns:** Description of return value

**Example:**
\`\`\`javascript
// Example usage
\`\`\``,
        },
      },
    },
    {
      id: "create_changelog",
      type: "tool",
      name: "Create CHANGELOG",
      config: {
        tool: "write_file",
        parameters: {
          path: "CHANGELOG.md",
          content: `# Changelog

All notable changes to ${"${variables.projectName}"} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release`,
        },
      },
    },
  ],
};
