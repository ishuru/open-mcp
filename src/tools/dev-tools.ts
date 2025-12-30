/**
 * Developer Tools
 * Handles Git operations, system information, and time utilities
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { wrapToolExecution } from "../utils/error-handler.js";
import { systemInfoCollector } from "../utils/system-info.js";
import {
  GitStatusResult,
  GitCommit,
  TimeInfo,
  TimeFormat
} from "../types/common.js";
import { ERROR_CODES, DEFAULTS } from "../constants/config.js";

const execAsync = promisify(exec);

export function registerDevTools(server: McpServer): void {
  registerGitStatus(server);
  registerGitLog(server);
  registerGitDiff(server);
  registerSystemInfo(server);
  registerGetTime(server);
}

function registerGitStatus(server: McpServer): void {
  server.tool("git_status",
    {
      path: z.string().optional().default(".")
    },
    async ({ path: gitPath }) => {
      return wrapToolExecution(async () => {
        const { stdout } = await execAsync(`git status --porcelain`, { cwd: gitPath });
        const branch = await getCurrentBranch(gitPath);
        const result = parseGitStatus(stdout, branch);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }, {
        errorCode: ERROR_CODES.GIT_OPERATION,
        context: "Failed to get git status"
      });
    }
  );
}

async function getCurrentBranch(cwd: string): Promise<string> {
  const { stdout } = await execAsync(`git rev-parse --abbrev-ref HEAD`, { cwd });
  return stdout.trim();
}

function parseGitStatus(stdout: string, branch: string): GitStatusResult {
  const lines = stdout.trim().split('\n').filter(line => line);
  const changes = lines.map(line => ({
    status: line.substring(0, 2).trim(),
    file: line.substring(3)
  }));

  return {
    branch,
    changes: changes.length > 0 ? changes : "No changes"
  };
}

function registerGitLog(server: McpServer): void {
  server.tool("git_log",
    {
      path: z.string().optional().default("."),
      maxCount: z.number().optional().default(DEFAULTS.MAX_COMMITS)
    },
    async ({ path: gitPath, maxCount }) => {
      return wrapToolExecution(async () => {
        const { stdout } = await execAsync(
          `git log -${maxCount} --pretty=format:"%H|%an|%ad|%s" --date=iso`,
          { cwd: gitPath }
        );

        const commits = parseGitLog(stdout);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(commits, null, 2)
          }]
        };
      }, {
        errorCode: ERROR_CODES.GIT_OPERATION,
        context: "Failed to get git log"
      });
    }
  );
}

function parseGitLog(stdout: string): GitCommit[] {
  const lines = stdout.trim().split('\n').filter(line => line);
  return lines.map(line => {
    const [hash, author, date, message] = line.split('|');
    return {
      hash: hash.substring(0, 8),
      author,
      date,
      message
    };
  });
}

function registerGitDiff(server: McpServer): void {
  server.tool("git_diff",
    {
      path: z.string().optional().default("."),
      cached: z.boolean().optional().default(false)
    },
    async ({ path: gitPath, cached }) => {
      return wrapToolExecution(async () => {
        const cachedFlag = cached ? "--cached" : "";
        const { stdout } = await execAsync(`git diff ${cachedFlag}`, { cwd: gitPath });

        return {
          content: [{
            type: "text" as const,
            text: stdout || "No differences"
          }]
        };
      }, {
        errorCode: ERROR_CODES.GIT_OPERATION,
        context: "Failed to get git diff"
      });
    }
  );
}

function registerSystemInfo(server: McpServer): void {
  server.tool("system_info",
    {
      include: z.array(z.enum(["platform", "memory", "cpu", "uptime"])).optional()
    },
    async ({ include }) => {
      return wrapToolExecution(async () => {
        const info = systemInfoCollector.collectSystemInfo(include);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(info, null, 2)
          }]
        };
      }, {
        errorCode: ERROR_CODES.SYSTEM_INFO,
        context: "Failed to get system info"
      });
    }
  );
}

function registerGetTime(server: McpServer): void {
  server.tool("get_time",
    {
      timezone: z.string().optional(),
      format: z.enum(["iso", "unix", "locale"]).optional().default(DEFAULTS.TIME_FORMAT)
    },
    async ({ timezone, format }) => {
      return wrapToolExecution(async () => {
        const info = formatTime(new Date(), format as TimeFormat, timezone);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(info, null, 2)
          }]
        };
      }, {
        errorCode: ERROR_CODES.SYSTEM_INFO,
        context: "Failed to get time"
      });
    }
  );
}

function formatTime(now: Date, format: TimeFormat, timezone?: string): TimeInfo {
  let time: string;

  switch (format) {
    case "unix":
      time = now.getTime().toString();
      break;
    case "locale":
      time = now.toLocaleString();
      break;
    case "iso":
    default:
      time = now.toISOString();
      break;
  }

  const info: TimeInfo = {
    time,
    format,
    timezone: timezone || "UTC"
  };

  if (timezone) {
    info.timeInTimezone = formatTimeInTimezone(now, timezone);
  }

  return info;
}

function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(date);
}
