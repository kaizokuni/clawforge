/**
 * Cross-platform utilities.
 * Path normalization, OS detection, and environment helpers.
 */

import path from "node:path";
import os from "node:os";

/** Supported platform identifiers. */
export type Platform = "windows" | "macos" | "linux";

/**
 * Detect the current operating system.
 * @returns The platform identifier.
 */
export function detectPlatform(): Platform {
  switch (os.platform()) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    default:
      return "linux";
  }
}

/**
 * Normalize a file path for the current platform.
 * Resolves `~` to the home directory and normalizes separators.
 * @param filePath - The raw path string.
 * @returns A fully resolved, platform-correct path.
 */
export function normalizePath(filePath: string): string {
  let resolved = filePath;
  if (resolved.startsWith("~")) {
    resolved = path.join(os.homedir(), resolved.slice(1));
  }
  return path.resolve(resolved);
}

/**
 * Join path segments using the platform separator.
 * Wrapper around path.join for clarity and consistency.
 * @param segments - Path segments to join.
 * @returns The joined path.
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Check if a path is absolute.
 * @param filePath - The path to check.
 * @returns True if the path is absolute.
 */
export function isAbsolutePath(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

/**
 * Get the platform-specific line ending.
 * @returns "\r\n" on Windows, "\n" elsewhere.
 */
export function lineEnding(): string {
  return detectPlatform() === "windows" ? "\r\n" : "\n";
}

/**
 * Get the platform-specific path separator.
 * @returns ";" on Windows, ":" elsewhere.
 */
export function pathSeparator(): string {
  return detectPlatform() === "windows" ? ";" : ":";
}

/**
 * Convert a path to use forward slashes (useful for display and URLs).
 * @param filePath - The path to convert.
 * @returns The path with forward slashes.
 */
export function toForwardSlashes(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

/**
 * Get a short display name from a full path.
 * Returns the last two segments for readability.
 * @param filePath - The full path.
 * @returns A short display string.
 */
export function shortPath(filePath: string): string {
  const parts = filePath.split(path.sep);
  if (parts.length <= 2) {
    return filePath;
  }
  return path.join("...", parts[parts.length - 2]!, parts[parts.length - 1]!);
}
