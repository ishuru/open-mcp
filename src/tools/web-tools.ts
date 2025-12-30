/**
 * Web and API Tools
 * Handles HTTP requests and HTML scraping
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wrapToolExecution } from "../utils/error-handler.js";
import {
  HttpMethod,
  HtmlExtraction
} from "../types/common.js";
import { DEFAULTS, ERROR_CODES, DEFAULT_TIMEOUTS } from "../constants/config.js";

export function registerWebTools(server: McpServer): void {
  registerFetchUrl(server);
  registerScrapeHtml(server);
}

function registerFetchUrl(server: McpServer): void {
  server.tool("fetch_url",
    {
      url: z.string().url("Valid URL is required"),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional().default(DEFAULTS.HTTP_METHOD),
      headers: z.record(z.string()).optional().default({}),
      body: z.string().optional(),
      timeout: z.number().optional().default(DEFAULT_TIMEOUTS.HTTP_REQUEST),
      followRedirects: z.boolean().optional().default(DEFAULTS.HTTP_FOLLOW_REDIRECTS)
    },
    async ({ url, method, headers, body, timeout, followRedirects }) => {
      return wrapToolExecution(async () => {
        const response = await fetchWithTimeout(url, {
          method,
          headers,
          body,
          timeout,
          followRedirects
        });

        const responseText = await response.text();
        const responseHeaders = extractHeaders(response);

        return {
          content: [{ type: "text" as const, text: responseText }],
          metadata: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            url: response.url
          }
        };
      }, {
        errorCode: ERROR_CODES.HTTP_REQUEST,
        context: "Failed to fetch URL"
      });
    }
  );
}

/**
 * HTTP fetch with timeout and proper cleanup
 */
async function fetchWithTimeout(
  url: string,
  options: {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: string;
    timeout: number;
    followRedirects: boolean;
  }
): Promise<Response> {
  const { method, headers, body, timeout, followRedirects } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestInit: RequestInit = {
    method,
    headers,
    signal: controller.signal,
    redirect: followRedirects ? "follow" : "manual"
  };

  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    requestInit.body = body;
  }

  try {
    const response = await fetch(url, requestInit);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract headers from Response object
 */
function extractHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

function registerScrapeHtml(server: McpServer): void {
  server.tool("scrape_html",
    {
      url: z.string().url("Valid URL is required"),
      extractText: z.boolean().optional().default(DEFAULTS.EXTRACT_TEXT),
      extractLinks: z.boolean().optional().default(DEFAULTS.EXTRACT_LINKS),
      extractImages: z.boolean().optional().default(DEFAULTS.EXTRACT_IMAGES)
    },
    async ({ url, extractText, extractLinks, extractImages }) => {
      return wrapToolExecution(async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const results = extractHtmlContent(html, extractText, extractLinks, extractImages);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(results, null, 2)
          }],
          metadata: {
            url,
            extracted: {
              text: extractText,
              links: extractLinks,
              images: extractImages
            }
          }
        };
      }, {
        errorCode: ERROR_CODES.HTTP_REQUEST,
        context: "Failed to scrape HTML"
      });
    }
  );
}

/**
 * Extract HTML content based on requested options
 */
function extractHtmlContent(
  html: string,
  extractText: boolean,
  extractLinks: boolean,
  extractImages: boolean
): HtmlExtraction {
  const results: HtmlExtraction = {};

  if (extractText) {
    results.text = extractTextFromHtml(html);
  }

  if (extractLinks) {
    results.links = extractLinksFromHtml(html);
  }

  if (extractImages) {
    results.images = extractImagesFromHtml(html);
  }

  return results;
}

/**
 * Extract plain text from HTML by removing tags
 */
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract all links from HTML
 */
function extractLinksFromHtml(html: string): Array<{ href: string; text: string }> {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  const links: Array<{ href: string; text: string }> = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({ href: match[1], text: match[2].trim() });
  }

  return links;
}

/**
 * Extract all image URLs from HTML
 */
function extractImagesFromHtml(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const images: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }

  return images;
}
