/**
 * Document-related Skills
 * Skills for reading, analyzing, and summarizing documents
 */

import { Skill } from "../../types/skills.js";

// ============================================================================
// Document Skills
// ============================================================================

export const summarizeDocument: Skill = {
  id: "summarize_document",
  name: "Summarize Document",
  description: "Read a file and generate a summary using AI",
  category: "document",
  tools: [
    {
      tool: "read_file",
      name: "readFile",
      parameters: {
        path: "${input.filePath}",
        encoding: "${input.encoding}",
      },
    },
    {
      tool: "summarize",
      name: "summarize",
      parameters: "${result.readFile.text}",
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file to summarize",
      },
      encoding: {
        type: "string",
        description: "File encoding",
        default: "utf8",
      },
    },
    required: ["filePath"],
  },
  outputSchema: {
    type: "object",
    description: "Summary of the document",
    properties: {
      summary: {
        type: "string",
        description: "Generated summary",
      },
    },
  },
};

export const analyzeText: Skill = {
  id: "analyze_text",
  name: "Analyze Text",
  description: "Read a file and perform detailed text analysis",
  category: "document",
  tools: [
    {
      tool: "read_file",
      name: "readFile",
      parameters: {
        path: "${input.filePath}",
      },
    },
    {
      tool: "summarize",
      name: "analyze",
      parameters: {
        text: "${result.readFile.text}",
        maxLength: 500,
        language: "en",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file to analyze",
      },
    },
    required: ["filePath"],
  },
  outputSchema: {
    type: "object",
    description: "Analysis results",
  },
};

export const countWords: Skill = {
  id: "count_words",
  name: "Count Words in File",
  description: "Read a file and count words, lines, and characters",
  category: "document",
  tools: [
    {
      tool: "read_file",
      name: "readFile",
      parameters: {
        path: "${input.filePath}",
      },
    },
  ],
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Path to the file",
      },
    },
    required: ["filePath"],
  },
  outputSchema: {
    type: "object",
    description: "Word count statistics",
    properties: {
      words: { type: "number" },
      lines: { type: "number" },
      characters: { type: "number" },
    },
  },
};

// ============================================================================
// Skill Exports
// ============================================================================

export const documentSkills = [summarizeDocument, analyzeText, countWords];
