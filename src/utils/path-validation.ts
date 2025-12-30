/**
 * Path Validator - Encapsulates path validation logic
 * Class-based approach removes global state and improves testability
 */

import path from "path";
import fs from "fs/promises";

/**
 * PathValidator - Handles secure path validation with whitelist support
 */
export class PathValidator {
  private allowedDirectories: string[] = [];

  constructor(allowedDirs: string[] = []) {
    this.setAllowedDirectories(allowedDirs);
  }

  /**
   * Set allowed directories whitelist
   */
  setAllowedDirectories(dirs: string[]): void {
    this.allowedDirectories = dirs.map(d => path.resolve(d));
  }

  /**
   * Get current allowed directories
   */
  getAllowedDirectories(): string[] {
    return [...this.allowedDirectories];
  }

  /**
   * Clear all allowed directories (useful for testing)
   */
  clearAllowedDirectories(): void {
    this.allowedDirectories = [];
  }

  /**
   * Normalize and resolve paths, handle ~ expansion
   */
  normalizePath(inputPath: string): string {
    let expanded = inputPath;
    if (inputPath.startsWith("~")) {
      expanded = path.join(process.env.HOME || "", inputPath.slice(1));
    }
    return path.resolve(expanded);
  }

  /**
   * Core security: Validate path is within allowed directories
   */
  async validatePath(inputPath: string): Promise<string> {
    const normalized = this.normalizePath(inputPath);

    if (this.allowedDirectories.length === 0) {
      // If no directories specified, allow all paths (for development)
      return normalized;
    }

    // Check if path is within any allowed directory
    const isAllowed = this.allowedDirectories.some(allowedDir => {
      const relative = path.relative(allowedDir, normalized);
      return !relative.startsWith('..') && !path.isAbsolute(relative);
    });

    if (!isAllowed) {
      throw new Error(
        `Path "${inputPath}" is outside allowed directories: ` +
        this.allowedDirectories.join(", ")
      );
    }

    return normalized;
  }

  /**
   * Validate path exists
   */
  async validatePathExists(inputPath: string): Promise<string> {
    const normalized = await this.validatePath(inputPath);

    try {
      await fs.access(normalized);
      return normalized;
    } catch {
      throw new Error(`Path does not exist: ${inputPath}`);
    }
  }

  /**
   * Resolve symlinks for security
   */
  async resolveSafePath(inputPath: string): Promise<string> {
    const normalized = this.normalizePath(inputPath);
    try {
      return await fs.realpath(normalized);
    } catch {
      return normalized;
    }
  }

  /**
   * Check if path is within allowed directories
   */
  isPathAllowed(inputPath: string): boolean {
    const normalized = this.normalizePath(inputPath);

    if (this.allowedDirectories.length === 0) {
      return true;
    }

    return this.allowedDirectories.some(allowedDir => {
      const relative = path.relative(allowedDir, normalized);
      return !relative.startsWith('..') && !path.isAbsolute(relative);
    });
  }
}

// Default singleton instance for backward compatibility
const defaultValidator = new PathValidator();

// Export singleton methods for backward compatibility
export function setAllowedDirectories(dirs: string[]): void {
  defaultValidator.setAllowedDirectories(dirs);
}

export function getAllowedDirectories(): string[] {
  return defaultValidator.getAllowedDirectories();
}

export function normalizePath(inputPath: string): string {
  return defaultValidator.normalizePath(inputPath);
}

export async function validatePath(inputPath: string): Promise<string> {
  return defaultValidator.validatePath(inputPath);
}

export async function validatePathExists(inputPath: string): Promise<string> {
  return defaultValidator.validatePathExists(inputPath);
}

export async function resolveSafePath(inputPath: string): Promise<string> {
  return defaultValidator.resolveSafePath(inputPath);
}
