/**
 * Slash command executor.
 * Loads a command's instruction prompt and returns it as context for Claude Code.
 */

import { loadCommand, loadCommands } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Execute a slash command by name.
 * Returns the instruction prompt as context — Claude Code runs the actual instructions.
 * @param name - Command name or /name format.
 * @param task - Optional current task context to inject.
 * @param localDir - Optional local commands directory.
 * @returns Tool result with instruction context.
 */
export function runCommand(
  name: string,
  task: string = "",
  localDir?: string
): ToolResult {
  // Strip leading slash if present
  const cleanName = name.startsWith("/") ? name.slice(1) : name;

  const command = loadCommand(cleanName, localDir);
  if (!command) {
    return { success: false, error: `No command found: "${name}"` };
  }

  logger.info("Command executed", { name: command.name, category: command.category });

  const context = [
    `# Command: /${command.name}`,
    `> ${command.description}`,
    `> Category: ${command.category}`,
    "",
    "## Instructions",
    command.instructions,
    ...(task ? ["", "## Current Task", task] : []),
  ].join("\n");

  return {
    success: true,
    data: {
      command: command.name,
      category: command.category,
      context,
    },
  };
}

/**
 * List all available commands.
 * @param localDir - Optional local commands directory.
 * @returns Tool result with commands array.
 */
export function listCommands(localDir?: string): ToolResult {
  const commands = loadCommands(localDir);

  return {
    success: true,
    data: {
      commands: commands.map(c => ({
        name: c.name,
        description: c.description,
        category: c.category,
      })),
    },
  };
}
