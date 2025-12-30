/**
 * File and Directory Tools
 * Handles file system operations with security validation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { readdir } from "fs/promises";
import { minimatch } from "minimatch";
import { validatePath, validatePathExists } from "../utils/path-validation.js";
import { wrapToolExecution } from "../utils/error-handler.js";
import {
  FileEncoding
} from "../types/common.js";
import { DEFAULTS, ERROR_CODES } from "../constants/config.js";

export function registerFileTools(server: McpServer): void {
  registerReadFile(server);
  registerWriteFile(server);
  registerListDirectory(server);
  registerSearchFiles(server);
}

function registerReadFile(server: McpServer): void {
  server.tool("read_file",
    {
      path: z.string().min(1, "Path is required"),
      encoding: z.enum(["utf8", "utf-16le", "latin1"]).optional().default(DEFAULTS.FILE_ENCODING)
    },
    async ({ path: filePath, encoding }) => {
      return wrapToolExecution(async () => {
        const validatedPath = await validatePathExists(filePath);
        const content = await fs.readFile(validatedPath, { encoding: encoding as FileEncoding });
        const stats = await fs.stat(validatedPath);

        return {
          content: [{ type: "text" as const, text: content }],
          metadata: {
            path: validatedPath,
            size: stats.size,
            encoding
          }
        };
      }, {
        errorCode: ERROR_CODES.FILE_OPERATION,
        context: "Failed to read file"
      });
    }
  );
}

function registerWriteFile(server: McpServer): void {
  server.tool("write_file",
    {
      path: z.string().min(1, "Path is required"),
      content: z.string(),
      encoding: z.enum(["utf8", "utf-16le", "latin1"]).optional().default(DEFAULTS.FILE_ENCODING),
      createDirectories: z.boolean().optional().default(DEFAULTS.CREATE_DIRECTORIES)
    },
    async ({ path: filePath, content, encoding, createDirectories }) => {
      return wrapToolExecution(async () => {
        const validatedPath = await validatePath(filePath);

        if (createDirectories) {
          const dir = path.dirname(validatedPath);
          await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(validatedPath, content, { encoding: encoding as FileEncoding });

        return {
          content: [{
            type: "text" as const,
            text: `Successfully wrote ${content.length} characters to ${validatedPath}`
          }]
        };
      }, {
        errorCode: ERROR_CODES.FILE_OPERATION,
        context: "Failed to write file"
      });
    }
  );
}

function registerListDirectory(server: McpServer): void {
  server.tool("list_directory",
    {
      path: z.string().min(1, "Path is required"),
      includeHidden: z.boolean().optional().default(DEFAULTS.INCLUDE_HIDDEN_FILES),
      recursive: z.boolean().optional().default(DEFAULTS.RECURSIVE_SEARCH)
    },
    async ({ path: dirPath, includeHidden, recursive }) => {
      return wrapToolExecution(async () => {
        const validatedPath = await validatePathExists(dirPath);
        const results: string[] = [];

        await listDirectoryRecursive(validatedPath, "", includeHidden, recursive, results);

        return {
          content: [{
            type: "text" as const,
            text: results.length > 0 ? results.join("\n") : "Directory is empty"
          }]
        };
      }, {
        errorCode: ERROR_CODES.FILE_OPERATION,
        context: "Failed to list directory"
      });
    }
  );
}

/**
 * Helper function for recursive directory listing
 */
async function listDirectoryRecursive(
  currentPath: string,
  baseRelative: string,
  includeHidden: boolean,
  recursive: boolean,
  results: string[]
): Promise<void> {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) {
      continue;
    }

    const relativePath = path.join(baseRelative, entry.name);
    const fullPath = path.join(currentPath, entry.name);

    const prefix = entry.isDirectory() ? "[DIR]" : "[FILE]";
    results.push(`${prefix} ${relativePath}`);

    if (recursive && entry.isDirectory()) {
      await listDirectoryRecursive(fullPath, relativePath, includeHidden, recursive, results);
    }
  }
}

function registerSearchFiles(server: McpServer): void {
  server.tool("search_files",
    {
      path: z.string().min(1, "Search root path is required"),
      pattern: z.string().min(1, "Glob pattern is required"),
      excludePatterns: z.array(z.string()).optional().default([])
    },
    async ({ path: searchPath, pattern, excludePatterns }) => {
      return wrapToolExecution(async () => {
        const validatedPath = await validatePathExists(searchPath);
        const matches = await searchFilesOptimized(validatedPath, pattern, excludePatterns);

        return {
          content: [{
            type: "text" as const,
            text: matches.length > 0 ? matches.join("\n") : "No files found matching pattern"
          }],
          metadata: {
            count: matches.length,
            pattern
          }
        };
      }, {
        errorCode: ERROR_CODES.FILE_OPERATION,
        context: "Failed to search files"
      });
    }
  );
}

/**
 * Optimized file search with glob pattern matching
 */
async function searchFilesOptimized(
  searchPath: string,
  pattern: string,
  excludePatterns: string[]
): Promise<string[]> {
  const matches: string[] = [];

  async function searchDir(currentPath: string, baseRelative: string = ""): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(baseRelative, entry.name);
      const fullPath = path.join(currentPath, entry.name);

      // Check if matches pattern
      if (minimatch(relativePath, pattern, { dot: true })) {
        const isExcluded = excludePatterns.some(excl =>
          minimatch(relativePath, excl, { dot: true })
        );
        if (!isExcluded) {
          matches.push(relativePath);
        }
      }

      if (entry.isDirectory()) {
        await searchDir(fullPath, relativePath);
      }
    }
  }

  await searchDir(searchPath);
  return matches;
}
