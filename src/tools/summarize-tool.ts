/**
 * AI Summarization Tool
 * Uses Google Gemini 1.5 Pro to generate text summaries
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { wrapToolExecution } from "../utils/error-handler.js";
import { SummarizeOptions } from "../types/common.js";
import { DEFAULTS, ERROR_CODES } from "../constants/config.js";

export function registerSummarizeTool(server: McpServer): void {
  server.tool("summarize",
    {
      text: z.string().min(1),
      maxLength: z.number().optional().default(DEFAULTS.MAX_SUMMARY_LENGTH),
      language: z.string().optional().default(DEFAULTS.SUMMARY_LANGUAGE)
    },
    async ({ text, maxLength, language }) => {
      return wrapToolExecution(async () => {
        const options: SummarizeOptions = { text, maxLength, language };
        const summary = await generateSummary(options);

        return {
          content: [{ type: "text" as const, text: summary }]
        };
      }, {
        errorCode: ERROR_CODES.AI_OPERATION,
        context: "Failed to generate summary",
        rethrow: true
      });
    }
  );
}

async function generateSummary(options: SummarizeOptions): Promise<string> {
  const { text, maxLength, language } = options;

  const prompt = `Please summarize the following text in ${language}, keeping the summary within ${maxLength} characters:\n\n${text}`;

  const model = google.chat("gemini-1.5-pro");
  const result = await generateText({
    model: model,
    prompt: prompt,
    maxTokens: maxLength,
    temperature: DEFAULTS.AI_TEMPERATURE
  });

  return result.text;
}
