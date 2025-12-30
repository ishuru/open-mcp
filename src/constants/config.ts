/**
 * Configuration constants for the Personal MCP Server
 * Centralized constants eliminate magic numbers throughout the codebase
 */

// ============================================================================
// Default Timeouts (milliseconds)
// ============================================================================

export const DEFAULT_TIMEOUTS = {
  HTTP_REQUEST: 30000,
  FILE_OPERATION: 5000,
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULTS = {
  MAX_SUMMARY_LENGTH: 200,
  SUMMARY_LANGUAGE: "en",
  MAX_COMMITS: 10,
  FILE_ENCODING: "utf8" as const,
  HTTP_METHOD: "GET" as const,
  HTTP_FOLLOW_REDIRECTS: true,
  INCLUDE_HIDDEN_FILES: false,
  RECURSIVE_SEARCH: false,
  CREATE_DIRECTORIES: false,
  EXTRACT_TEXT: true,
  EXTRACT_LINKS: false,
  EXTRACT_IMAGES: false,
  AI_TEMPERATURE: 0.5,
  TIME_FORMAT: "iso" as const,
} as const;

// ============================================================================
// Memory Conversion Constants
// ============================================================================

export const MEMORY_CONVERSION = {
  BYTES_TO_GB: 1024 * 1024 * 1024,
  DECIMAL_PLACES: 2,
} as const;

// ============================================================================
// Time Conversion Constants
// ============================================================================

export const TIME_CONVERSION = {
  SECONDS_TO_MINUTES: 60,
  MINUTES_TO_HOURS: 60,
  SECONDS_TO_HOURS: 3600,
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  PATH_VALIDATION: "PATH_VALIDATION_ERROR",
  PATH_NOT_FOUND: "PATH_NOT_FOUND",
  FILE_OPERATION: "FILE_OPERATION_ERROR",
  HTTP_REQUEST: "HTTP_REQUEST_ERROR",
  HTTP_TIMEOUT: "HTTP_REQUEST_TIMEOUT",
  GIT_OPERATION: "GIT_OPERATION_ERROR",
  SYSTEM_INFO: "SYSTEM_INFO_ERROR",
  AI_OPERATION: "AI_OPERATION_ERROR",
} as const;
