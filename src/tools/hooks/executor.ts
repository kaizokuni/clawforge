/**
 * Hook executor.
 * When a trigger fires, loads the hook's action prompt and logs the execution.
 * Full action execution (calling Claude) is wired in Phase 5.
 */

import { loadHooks } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Execute a hook by name.
 * Returns the hook's action prompt as context.
 * @param name - Hook name to execute.
 * @param context - Runtime context (e.g. changedFile, exitCode).
 * @param localDir - Optional local hooks directory.
 * @returns Tool result with hook action prompt.
 */
export function executeHook(
  name: string,
  context: Record<string, string> = {},
  localDir?: string
): ToolResult {
  const hooks = loadHooks(localDir);
  const hook = hooks.find(h => h.name === name);

  if (!hook) {
    return { success: false, error: `No hook found: "${name}"` };
  }

  logger.info("Hook executing", { name: hook.name, trigger: hook.trigger, context });

  // Interpolate context values into action prompt
  let action = hook.action;
  for (const [key, value] of Object.entries(context)) {
    action = action.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  const prompt = [
    `# Hook: ${hook.name}`,
    `> Trigger: ${hook.trigger}`,
    `> ${hook.description}`,
    "",
    "## Action",
    action,
    ...(Object.keys(context).length > 0
      ? ["", "## Context", ...Object.entries(context).map(([k, v]) => `- ${k}: ${v}`)]
      : []),
  ].join("\n");

  return {
    success: true,
    data: {
      hook: hook.name,
      trigger: hook.trigger,
      prompt,
    },
  };
}

/**
 * Trigger a hook by name (same as executeHook, exposed as a CLI-friendly alias).
 * @param name - Hook name.
 * @param context - Runtime context key-value pairs.
 * @param localDir - Optional local hooks directory.
 * @returns Tool result.
 */
export function triggerHook(
  name: string,
  context: Record<string, string> = {},
  localDir?: string
): ToolResult {
  return executeHook(name, context, localDir);
}

/**
 * List all available hooks.
 * @param localDir - Optional local hooks directory.
 * @returns Tool result with hooks array.
 */
export function listHooks(localDir?: string): ToolResult {
  const hooks = loadHooks(localDir);
  return {
    success: true,
    data: {
      hooks: hooks.map(h => ({
        name: h.name,
        description: h.description,
        trigger: h.trigger,
        conditions: h.conditions,
      })),
    },
  };
}
