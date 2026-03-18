/**
 * Settings preset applier.
 * Applies a preset at runtime by updating the tool permission map.
 * When a disabled tool is called, returns a structured error.
 */

import { loadPreset } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { PermissionSet, ToolResult } from "../../shared/types.js";

/** Currently active permission set (null = no restrictions). */
let activePreset: string | null = null;
let activePermissions: PermissionSet | null = null;

/**
 * Apply a settings preset by name.
 * @param name - Preset name.
 * @param localDir - Optional local settings directory.
 * @returns Tool result.
 */
export function applyPreset(name: string, localDir?: string): ToolResult {
  const preset = loadPreset(name, localDir);
  if (!preset) {
    return { success: false, error: `No preset found: "${name}"` };
  }

  activePreset = preset.name;
  activePermissions = preset.permissions;

  logger.info("Settings preset applied", {
    name: preset.name,
    blockedTools: preset.permissions.blockedTools,
    readOnly: preset.permissions.readOnly,
  });

  return {
    success: true,
    data: {
      preset: preset.name,
      description: preset.description,
      permissions: preset.permissions,
    },
  };
}

/**
 * Clear the active preset, restoring full permissions.
 * @returns Tool result.
 */
export function clearPreset(): ToolResult {
  const previous = activePreset;
  activePreset = null;
  activePermissions = null;
  logger.info("Settings preset cleared", { previous });
  return { success: true, data: { cleared: previous } };
}

/**
 * Get the currently active preset name.
 * @returns Preset name or null.
 */
export function getActivePreset(): string | null {
  return activePreset;
}

/**
 * Check if a tool is allowed under the current preset.
 * @param toolName - MCP tool name to check.
 * @returns ToolResult with allowed=true or an error explaining why it's blocked.
 */
export function checkToolAllowed(toolName: string): ToolResult {
  if (!activePermissions) {
    return { success: true, data: { allowed: true } };
  }

  const perms = activePermissions;

  // Check explicit block list
  if (perms.blockedTools.includes(toolName)) {
    return {
      success: false,
      error: `Tool "${toolName}" is disabled by the "${activePreset}" preset.`,
    };
  }

  // Check allowed list (if non-empty, it's an allowlist)
  if (perms.allowedTools.length > 0 && !perms.allowedTools.includes(toolName)) {
    return {
      success: false,
      error: `Tool "${toolName}" is not in the allowed list for the "${activePreset}" preset.`,
    };
  }

  // Read-only mode: block any write or destructive tools
  if (perms.readOnly) {
    const writeTools = [
      "browser_click", "browser_type", "browser_evaluate",
      "memory_store", "cron_schedule", "cron_remove",
      "skill_install", "marketplace_install",
      "hook_trigger", "settings_apply",
    ];
    if (writeTools.includes(toolName)) {
      return {
        success: false,
        error: `Tool "${toolName}" is blocked in read-only mode (preset: "${activePreset}").`,
      };
    }
  }

  // Network restrictions
  if (!perms.allowNetwork && (toolName === "web_search" || toolName === "web_fetch")) {
    return {
      success: false,
      error: `Network access is disabled by the "${activePreset}" preset.`,
    };
  }

  // Browser restrictions
  if (!perms.allowBrowser && toolName.startsWith("browser_")) {
    return {
      success: false,
      error: `Browser tools are disabled by the "${activePreset}" preset.`,
    };
  }

  return { success: true, data: { allowed: true } };
}

/**
 * List active preset info.
 * @returns Tool result with current preset details.
 */
export function getPresetStatus(): ToolResult {
  return {
    success: true,
    data: {
      activePreset,
      permissions: activePermissions,
    },
  };
}
