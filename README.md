# Personal MCP Server

A comprehensive Model Context Protocol (MCP) server that provides 15+ tools across 4 categories for daily development tasks. Features file operations, web/API tools, developer utilities, and AI-powered summarization.

## Features

- **File & Code Tools**: Read, write, list, and search files with glob patterns
- **Web & API Tools**: Fetch URLs and scrape HTML content
- **Developer Tools**: Git operations, system info, and time utilities
- **AI Tools**: Text summarization using Google's Gemini 1.5 Pro
- **Security**: Path validation with allowed directories whitelist
- **Resources**: Dynamic greetings and server information

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Configuration

You can specify allowed directories as command-line arguments:

```bash
node dist/index.js /path/to/workspace /home/user/documents
```

Without arguments, file tools will allow access to all paths (for development).

## Available Tools

### File & Code Tools

#### read_file
Read file contents with encoding support.

**Parameters:**
- `path` (string, required): File path to read
- `encoding` (string, optional): "utf8" | "utf-16le" | "latin1" (default: "utf8")

**Example:**
```json
{
  "path": "/path/to/file.txt",
  "encoding": "utf8"
}
```

#### write_file
Create or overwrite files.

**Parameters:**
- `path` (string, required): File path to write
- `content` (string, required): Content to write
- `encoding` (string, optional): "utf8" | "utf-16le" | "latin1" (default: "utf8")
- `createDirectories` (boolean, optional): Auto-create parent directories (default: false)

**Example:**
```json
{
  "path": "/path/to/file.txt",
  "content": "Hello, World!",
  "createDirectories": true
}
```

#### list_directory
List files and directories.

**Parameters:**
- `path` (string, required): Directory path to list
- `includeHidden` (boolean, optional): Include hidden files (default: false)
- `recursive` (boolean, optional): List recursively (default: false)

**Example:**
```json
{
  "path": "/path/to/dir",
  "includeHidden": false,
  "recursive": true
}
```

#### search_files
Search files using glob patterns.

**Parameters:**
- `path` (string, required): Root search path
- `pattern` (string, required): Glob pattern (e.g., "*.ts", "**/*.js")
- `excludePatterns` (array, optional): Patterns to exclude

**Example:**
```json
{
  "path": "/src",
  "pattern": "**/*.ts",
  "excludePatterns": ["**/node_modules/**", "**/dist/**"]
}
```

### Web & API Tools

#### fetch_url
Make HTTP requests to URLs.

**Parameters:**
- `url` (string, required): URL to fetch
- `method` (string, optional): "GET" | "POST" | "PUT" | "DELETE" | "PATCH" (default: "GET")
- `headers` (object, optional): HTTP headers
- `body` (string, optional): Request body
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)
- `followRedirects` (boolean, optional): Follow HTTP redirects (default: true)

**Example:**
```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "timeout": 10000
}
```

#### scrape_html
Extract content from HTML pages.

**Parameters:**
- `url` (string, required): URL to scrape
- `extractText` (boolean, optional): Extract text content (default: true)
- `extractLinks` (boolean, optional): Extract links (default: false)
- `extractImages` (boolean, optional): Extract images (default: false)

**Example:**
```json
{
  "url": "https://example.com",
  "extractText": true,
  "extractLinks": true,
  "extractImages": true
}
```

### Developer Tools

#### git_status
Get git repository status.

**Parameters:**
- `path` (string, optional): Repository path (default: ".")

**Example:**
```json
{
  "path": "."
}
```

#### git_log
Get git commit history.

**Parameters:**
- `path` (string, optional): Repository path (default: ".")
- `maxCount` (number, optional): Maximum commits to return (default: 10)

**Example:**
```json
{
  "path": ".",
  "maxCount": 20
}
```

#### git_diff
Get git diff output.

**Parameters:**
- `path` (string, optional): Repository path (default: ".")
- `cached` (boolean, optional): Show staged changes (default: false)

**Example:**
```json
{
  "path": ".",
  "cached": false
}
```

#### system_info
Get system information.

**Parameters:**
- `include` (array, optional): Categories to include: "platform" | "memory" | "cpu" | "uptime"

**Example:**
```json
{
  "include": ["platform", "memory", "cpu"]
}
```

#### get_time
Get current time with timezone support.

**Parameters:**
- `timezone` (string, optional): Timezone (e.g., "America/New_York")
- `format` (string, optional): "iso" | "unix" | "locale" (default: "iso")

**Example:**
```json
{
  "timezone": "America/New_York",
  "format": "locale"
}
```

### AI Tools

#### summarize
Summarize text using Google's Gemini 1.5 Pro.

**Parameters:**
- `text` (string, required): Text to summarize
- `maxLength` (number, optional): Maximum summary length in characters (default: 200)
- `language` (string, optional): Target language (default: "en")

**Example:**
```json
{
  "text": "Long text to summarize...",
  "maxLength": 100,
  "language": "en"
}
```

**Note:** Requires `GOOGLE_GENERATIVE_AI_API_KEY` environment variable. Get your key at https://ai.google.dev/

## Resources

### greeting
Dynamic greeting resource.
- URI format: `greeting://{name}`
- Returns: Personalized greeting message

### server-info
Server information and capabilities.
- URI format: `server-info://`
- Returns: Server version, allowed directories, and available tools

## Usage with Claude Desktop

To integrate this server with Claude Desktop, add the following to your Claude Desktop config:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "personal-assistant": {
      "command": "node",
      "args": [
        "/absolute/path/to/personal-mcp-server/dist/index.js",
        "/Users/yourname/workspace",
        "/Users/yourname/documents"
      ],
      "env": {
        "GOOGLE_GENERATIVE_AI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace the paths with your actual directories and API key.

## Development

- Use `npm run dev` to start the TypeScript compiler in watch mode
- Modify files in `src/tools/` to add or customize tools
- Add new tool categories by creating new files in `src/tools/`

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── tools/
│   ├── file-tools.ts        # File operations
│   ├── web-tools.ts         # Web/API tools
│   ├── dev-tools.ts         # Developer tools
│   └── summarize-tool.ts    # AI summarization
├── utils/
│   ├── path-validation.ts   # Security utilities
│   └── error-handling.ts    # Error handling
```

## Testing with MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a visual tool for testing MCP servers:

```bash
npx @modelcontextprotocol/inspector node dist/index.js /allowed/path
```

## Security

- File operations validate paths against allowed directories whitelist
- Command injection prevention through argument arrays
- Timeout protection on HTTP requests
- No directory traversal attacks possible

**Important:** Always specify allowed directories when running the server in production:

```bash
node dist/index.js /safe/workspace/directory
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
