# MCP Content Summarizer Server

A Model Context Protocol (MCP) server that provides intelligent summarization capabilities for various types of content using Google's Gemini 1.5 Pro model. This server can help you generate concise summaries while maintaining key information from different content formats.

<a href="https://3min.top"><img width="380" height="200" src="/public/imgs/section1_en.jpg" alt="MCP Content Summarizer Server" /></a>

## Powered by 3MinTop

The summarization service is powered by [3MinTop](https://3min.top), an AI-powered reading tool that helps you understand a chapter's content in just three minutes. 3MinTop transforms complex content into clear summaries, making learning efficient and helping build lasting reading habits.

## Features

- Universal content summarization using Google's Gemini 1.5 Pro model
- Support for multiple content types:
  - Plain text
  - Web pages
  - PDF documents
  - EPUB books
  - HTML content
- Customizable summary length
- Multi-language support
- Smart context preservation
- Dynamic greeting resource for testing

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   pnpm install
   ```

3. Build the project:
   ```
   pnpm run build
   ```

4. Start the server:
   ```
   pnpm start
   ```

## Development

- Use `pnpm run dev` to start the TypeScript compiler in watch mode
- Modify `src/index.ts` to customize server behavior or add new tools

## GitHub Codespaces Setup

This project includes a fully configured GitHub Codespaces development environment.

### Quick Start

1. Click **Code** > **Codespaces** > **Create codespace on main**
2. Wait for the container to build (this may take a few minutes on first run)
3. The project will automatically:
   - Install all dependencies via pnpm
   - Build the TypeScript project
   - Configure VS Code extensions

### Environment Variables

Before running the server, you need to set up your Google AI API key:

1. Go to [Google AI Studio](https://ai.google.dev/) and get your API key
2. In your repository, navigate to **Settings** > **Secrets and variables** > **Codespaces**
3. Click **New repository secret**
4. Name: `GOOGLE_GENERATIVE_AI_API_KEY`
5. Value: Your Google AI API key
6. Click **Add secret**

The validation script will check that this environment variable is set before starting the server.

### Running in Codespaces

```bash
# Validate environment (checks API key)
pnpm run validate-env

# Development mode (watch + run)
pnpm run dev    # Terminal 1: Watch for changes
pnpm start      # Terminal 2: Start the server

# Or build and start in one command
pnpm run dev:full
```

### Testing with MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a visual tool for testing MCP servers:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This will launch a web interface where you can test the `summarize` tool and `greeting` resource.

### VS Code Integration

The Codespace comes pre-configured with:

- **Tasks** (Ctrl/Cmd + Shift + B):
  - Build: Compile TypeScript
  - Watch: Watch for changes and recompile
  - Start Server: Build and start the MCP server
  - Validate Environment: Check required secrets

- **Debug Configuration** (F5):
  - Run MCP Server: Launch the server with debugger attached

### Troubleshooting

**Server won't start:**
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set in Codespaces secrets
- Check the build completed: `ls -la dist/index.js`
- Run validation manually: `pnpm run validate-env`

**Build errors:**
- Clean rebuild: `rm -rf dist && pnpm run build`
- Check Node.js version: `node --version` (should be 20+)
- Ensure dependencies installed: `pnpm install`

## Usage with Desktop App

To integrate this server with a desktop app, add the following to your app's server configuration:

```js
{
  "mcpServers": {
    "content-summarizer": {
      "command": "node",
      "args": [
        "{ABSOLUTE PATH TO FILE HERE}/dist/index.js"
      ]
    }
  }
}
```

## Available Tools

### summarize

Summarizes content from various sources using the following parameters:
- `content` (string | object): The input content to summarize. Can be:
  - Text string
  - URL for web pages
  - Base64 encoded PDF
  - EPUB file content
- `type` (string): Content type ("text", "url", "pdf", "epub")
- `maxLength` (number, optional): Maximum length of the summary in characters (default: 200)
- `language` (string, optional): Target language for the summary (default: "en")
- `focus` (string, optional): Specific aspect to focus on in the summary
- `style` (string, optional): Summary style ("concise", "detailed", "bullet-points")

Example usage:

```typescript
// Summarize a webpage
const result = await server.invoke("summarize", {
  content: "https://example.com/article",
  type: "url",
  maxLength: 300,
  style: "bullet-points"
});

// Summarize a PDF document
const result = await server.invoke("summarize", {
  content: pdfBase64Content,
  type: "pdf",
  language: "zh",
  style: "detailed"
});
```

### greeting

A dynamic resource that demonstrates basic MCP resource functionality:
- URI format: `greeting://{name}`
- Returns a greeting message with the provided name

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 