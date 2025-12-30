/**
 * Common type definitions for the Personal MCP Server
 * Centralized types eliminate Record<string, any> usage across the codebase
 */

// ============================================================================
// Core MCP Types
// ============================================================================

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Index signature for MCP SDK compatibility
}

export interface ToolError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// File Operation Types
// ============================================================================

export type FileEncoding = "utf8" | "utf-16le" | "latin1";
export type FileType = "file" | "directory";

export interface FileInfo {
  path: string;
  size: number;
  encoding?: FileEncoding;
  type?: FileType;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: FileType;
}

// ============================================================================
// HTTP/Web Types
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface HttpRequestOptions {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  followRedirects?: boolean;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  body: string;
}

// ============================================================================
// HTML Scraping Types
// ============================================================================

export interface HtmlExtraction {
  text?: string;
  links?: Array<{ href: string; text: string }>;
  images?: string[];
}

// ============================================================================
// Git Types
// ============================================================================

export interface GitStatusEntry {
  status: string;
  file: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitStatusResult {
  branch: string;
  changes: GitStatusEntry[] | string;
}

// ============================================================================
// System Info Types
// ============================================================================

export type SystemInfoCategory = "platform" | "memory" | "cpu" | "uptime";

export interface PlatformInfo {
  type: string;
  release: string;
  arch: string;
  hostname: string;
  homedir: string;
}

export interface MemoryInfo {
  total: string;
  free: string;
  used: string;
  usagePercent: string;
}

export interface CpuInfo {
  model: string;
  cores: number;
  speed: string;
  loadAverage: string[];
}

export interface UptimeInfo {
  seconds: number;
  formatted: string;
}

export interface SystemInfo {
  platform?: PlatformInfo;
  memory?: MemoryInfo;
  cpu?: CpuInfo;
  uptime?: UptimeInfo;
}

// ============================================================================
// Time Types
// ============================================================================

export type TimeFormat = "iso" | "unix" | "locale";

export interface TimeInfo {
  time: string;
  format: TimeFormat;
  timezone: string;
  timeInTimezone?: string;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchOptions {
  path: string;
  pattern: string;
  excludePatterns?: string[];
}

export interface SearchResult {
  matches: string[];
  count: number;
  pattern: string;
}

// ============================================================================
// Summarization Types
// ============================================================================

export interface SummarizeOptions {
  text: string;
  maxLength: number;
  language: string;
}
