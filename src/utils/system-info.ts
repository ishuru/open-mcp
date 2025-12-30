/**
 * System Information Collector
 * Extracts system info logic from dev-tools.ts to follow Single Responsibility Principle
 */

import os from "os";
import {
  PlatformInfo,
  MemoryInfo,
  CpuInfo,
  UptimeInfo,
  SystemInfo,
  SystemInfoCategory
} from "../types/common.js";
import { MEMORY_CONVERSION, TIME_CONVERSION } from "../constants/config.js";

/**
 * SystemInfoCollector - Handles collection of system information
 * Each method focuses on a single aspect of system information
 */
export class SystemInfoCollector {
  /**
   * Get platform information
   */
  getPlatformInfo(): PlatformInfo {
    return {
      type: os.platform(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      homedir: os.homedir()
    };
  }

  /**
   * Get memory information with formatted strings
   */
  getMemoryInfo(): MemoryInfo {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: this.formatBytesToGB(totalMem),
      free: this.formatBytesToGB(freeMem),
      used: this.formatBytesToGB(usedMem),
      usagePercent: this.calculatePercentage(usedMem, totalMem)
    };
  }

  /**
   * Get CPU information
   */
  getCpuInfo(): CpuInfo {
    const cpus = os.cpus();
    const firstCpu = cpus[0];

    return {
      model: firstCpu?.model || "Unknown",
      cores: cpus.length,
      speed: `${firstCpu?.speed || 0} MHz`,
      loadAverage: os.loadavg().map(avg => avg.toFixed(2))
    };
  }

  /**
   * Get uptime information
   */
  getUptimeInfo(): UptimeInfo {
    const uptime = os.uptime();
    const hours = Math.floor(uptime / TIME_CONVERSION.SECONDS_TO_HOURS);
    const minutes = Math.floor(
      (uptime % TIME_CONVERSION.SECONDS_TO_HOURS) / TIME_CONVERSION.SECONDS_TO_MINUTES
    );

    return {
      seconds: uptime,
      formatted: `${hours}h ${minutes}m`
    };
  }

  /**
   * Collect all or selected system information
   * @param categories - Optional array of categories to include
   * @returns SystemInfo object with requested categories
   */
  collectSystemInfo(categories?: SystemInfoCategory[]): SystemInfo {
    const info: SystemInfo = {};

    const shouldInclude = (category: SystemInfoCategory) =>
      !categories || categories.includes(category);

    if (shouldInclude("platform")) {
      info.platform = this.getPlatformInfo();
    }

    if (shouldInclude("memory")) {
      info.memory = this.getMemoryInfo();
    }

    if (shouldInclude("cpu")) {
      info.cpu = this.getCpuInfo();
    }

    if (shouldInclude("uptime")) {
      info.uptime = this.getUptimeInfo();
    }

    return info;
  }

  /**
   * Convert bytes to GB string
   */
  private formatBytesToGB(bytes: number): string {
    return (bytes / MEMORY_CONVERSION.BYTES_TO_GB)
      .toFixed(MEMORY_CONVERSION.DECIMAL_PLACES);
  }

  /**
   * Calculate percentage
   */
  private calculatePercentage(value: number, total: number): string {
    return ((value / total) * 100).toFixed(MEMORY_CONVERSION.DECIMAL_PLACES) + "%";
  }
}

// Export singleton instance for convenience
export const systemInfoCollector = new SystemInfoCollector();
