/**
 * Settings preset validator.
 * Validates a preset against the list of known MCP tools.
 * Warns about unknown tool names.
 */

import { loadPreset, loadPresets } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/** All known MCP tool names from CLAUDE.md. */
const KNOWN_TOOLS = new Set([
  "browser_open", "browser_screenshot", "browser_click", "browser_type",
  "browser_evaluate", "browser_content",
  "memory_search", "memory_timeline", "memory_get_observations", "memory_store",
  "web_search", "web_fetch",
  "design_preview", "design_iterate",
  "index_project", "index_search",
  "agent_delegate", "agent_list",
  "mcp_route", "mcp_list_servers",
  "monitor_status", "monitor_cost",
  "cron_schedule", "cron_list", "cron_remove",
  "skill_run", "skill_list", "skill_install",
  "command_run", "command_list",
  "hook_trigger", "hook_list",
  "settings_apply", "settings_list",
  "marketplace_search", "marketplace_install",
  "workflow_run", "workflow_list",
]);

/**
 * Validate a settings preset by name.
 * @param name - Preset name to validate.
 * @param localDir - Optional local settings directory.
 * @returns Tool result with validation report.
 */
export function validatePreset(name: string, localDir?: string): ToolResult {
  const preset = loadPreset(name, localDir);
  if (!preset) {
    return { success: false, error: `No preset found: "${name}"` };
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  const allToolRefs = [
    ...preset.permissions.allowedTools,
    ...preset.permissions.blockedTools,
  ];

  for (const toolName of allToolRefs) {
    if (!KNOWN_TOOLS.has(toolName)) {
      warnings.push(`Unknown tool name: "${toolName}" (not in the 35 registered MCP tools)`);
    }
  }

  if (preset.permissions.allowedTools.length > 0 && preset.permissions.blockedTools.length > 0) {
    warnings.push("Both allowed_tools and blocked_tools are set. allowed_tools takes precedence as an allowlist.");
  }

  const valid = errors.length === 0;
  logger.info("Preset validated", { name, valid, warnings: warnings.length, errors: errors.length });

  return {
    success: valid,
    data: {
      preset: preset.name,
      valid,
      warnings,
      errors,
    },
    ...(valid ? {} : { error: errors.join("; ") }),
  };
}

/**
 * Validate all available presets.
 * @param localDir - Optional local settings directory.
 * @returns Tool result with per-preset validation results.
 */
export function validateAllPresets(localDir?: string): ToolResult {
  const presets = loadPresets(localDir);
  const results = presets.map(p => {
    const r = validatePreset(p.name, localDir);
    return {
      name: p.name,
      valid: r.success,
      warnings: (r.data as { warnings?: string[] })?.warnings ?? [],
      errors: (r.data as { errors?: string[] })?.errors ?? [],
    };
  });

  return {
    success: true,
    data: { results, total: results.length, valid: results.filter(r => r.valid).length },
  };
}
