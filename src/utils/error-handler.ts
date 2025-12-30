/**
 * Centralized error handling utility for the Personal MCP Server
 * This eliminates 15+ duplicate try-catch blocks across all tools
 */

import { McpError } from "./error-handling.js";
import { ToolResult } from "../types/common.js";
import { ERROR_CODES } from "../constants/config.js";

type ToolExecutor = () => Promise<ToolResult> | ToolResult;

export interface ToolHandlerOptions {
  errorCode?: string;
  context?: string;
  rethrow?: boolean;
}

/**
 * Wraps tool execution with consistent error handling
 * @param executor - The tool function to execute
 * @param options - Error handling options
 * @returns ToolResult or throws McpError
 */
export async function wrapToolExecution(
  executor: ToolExecutor,
  options: ToolHandlerOptions = {}
): Promise<ToolResult> {
  const { errorCode = ERROR_CODES.FILE_OPERATION, context, rethrow = true } = options;

  try {
    return await executor();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const contextPrefix = context ? `${context}: ` : "";

    if (rethrow) {
      throw new McpError(
        `${contextPrefix}${errorMessage}`,
        errorCode,
        error
      );
    }

    return {
      content: [{
        type: "text" as const,
        text: `${contextPrefix}${errorMessage}`
      }]
    };
  }
}

/**
 * Extracts error message from unknown error type
 * @param error - Unknown error to extract message from
 * @returns Error message as string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Creates a standardized error result
 * @param message - Error message
 * @param code - Error code
 * @returns ToolResult with error content
 */
export function createErrorResult(
  message: string,
  code: string = ERROR_CODES.FILE_OPERATION
): ToolResult {
  return {
    content: [{
      type: "text" as const,
      text: `[${code}] ${message}`
    }]
  };
}

/**
 * Type guard for Error objects
 * @param error - Unknown value to check
 * @returns True if the value is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
