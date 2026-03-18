/**
 * Marketplace component security validator.
 * Scans component files for dangerous patterns before install.
 * Blocks or warns on: eval/exec, rm -rf, prompt injection markers, suspicious URLs.
 */

import fs from "node:fs";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/** Patterns that are always blocked — high-risk destructive operations. */
const BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\brm\s+-rf\b/i, reason: "Destructive shell command: rm -rf" },
  { pattern: /\beval\s*\(/,    reason: "Dangerous eval() call" },
  { pattern: /\bexec\s*\(/,    reason: "Dangerous exec() call — use specific tools instead" },
  { pattern: /process\.exit/,  reason: "process.exit() in component content" },
  { pattern: /require\s*\(/,   reason: "Dynamic require() in component" },
  { pattern: /child_process/,  reason: "child_process usage in component" },
];

/** Patterns that generate warnings — may be intentional but worth flagging. */
const WARN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /https?:\/\/[^\s'"]{50,}/, reason: "Long URL detected — verify before installing" },
  { pattern: /ignore previous instructions?/i, reason: "Possible prompt injection marker" },
  { pattern: /disregard (all |your |prior )/i, reason: "Possible prompt injection marker" },
  { pattern: /you are now/i, reason: "Possible persona override attempt" },
  { pattern: /\bpassword\b|\bsecret\b|\btoken\b/i, reason: "Sensitive keyword in component content" },
  { pattern: /curl\s+.*\|.*sh/i, reason: "Piped curl-to-shell pattern" },
  { pattern: /wget\s+.*&&/, reason: "wget with chained command" },
];

/**
 * Validate a component file for security issues.
 * @param filePath - Path to the component file to scan.
 * @returns Tool result — success=false if blocked patterns found, warnings in data.
 */
export function validateComponent(filePath: string): ToolResult {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return { success: false, error: `Cannot read file: ${String(err)}` };
  }

  const blocked: string[] = [];
  const warnings: string[] = [];

  for (const { pattern, reason } of BLOCK_PATTERNS) {
    if (pattern.test(content)) {
      blocked.push(reason);
    }
  }

  for (const { pattern, reason } of WARN_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(reason);
    }
  }

  if (blocked.length > 0) {
    logger.warn("Component blocked by security validator", { filePath, blocked });
    return {
      success: false,
      error: `Security validation failed:\n${blocked.map(b => `  • ${b}`).join("\n")}`,
      data: { blocked, warnings },
    };
  }

  if (warnings.length > 0) {
    logger.warn("Component has security warnings", { filePath, warnings });
  }

  return {
    success: true,
    data: { blocked: [], warnings, clean: warnings.length === 0 },
  };
}
