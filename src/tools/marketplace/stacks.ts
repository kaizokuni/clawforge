/**
 * Template stack installer.
 * Reads stack definition from ./stacks/<name>.yaml and installs each component.
 */

import fs from "node:fs";
import path from "node:path";
import { parse as yamlParse } from "yaml";
import { installFromPath } from "./installer.js";
import { logger } from "../../shared/logger.js";
import type { StackDefinition, ToolResult } from "../../shared/types.js";

/**
 * Load a stack definition from a YAML file.
 * @param stackPath - Path to the stack .yaml file.
 * @returns StackDefinition or undefined.
 */
export function loadStack(stackPath: string): StackDefinition | undefined {
  try {
    const raw = fs.readFileSync(stackPath, "utf-8");
    const data = yamlParse(raw) as Record<string, unknown>;
    return {
      name: (data["name"] as string) ?? path.basename(stackPath, ".yaml"),
      description: (data["description"] as string) ?? "",
      agents: (data["agents"] as string[]) ?? [],
      skills: (data["skills"] as string[]) ?? [],
      commands: (data["commands"] as string[]) ?? [],
      hooks: (data["hooks"] as string[]) ?? [],
      settings: (data["settings"] as string[]) ?? [],
      mcpServers: (data["mcp_servers"] as string[]) ?? [],
    };
  } catch {
    return undefined;
  }
}

/**
 * Install all components in a stack definition.
 * @param stackPathOrName - Path to stack .yaml or stack name (looks in ./stacks/).
 * @param stacksDir - Base directory to search for stack files.
 * @returns Tool result with per-component installation results.
 */
export function installStack(
  stackPathOrName: string,
  stacksDir: string = path.join(process.cwd(), "stacks")
): ToolResult {
  // Resolve path
  let stackPath = stackPathOrName;
  if (!fs.existsSync(stackPath)) {
    stackPath = path.join(stacksDir, `${stackPathOrName}.yaml`);
    if (!fs.existsSync(stackPath)) {
      stackPath = path.join(stacksDir, `${stackPathOrName}.yml`);
    }
  }

  if (!fs.existsSync(stackPath)) {
    return { success: false, error: `Stack not found: "${stackPathOrName}"` };
  }

  const stack = loadStack(stackPath);
  if (!stack) {
    return { success: false, error: `Failed to parse stack: ${stackPath}` };
  }

  const results: Array<{ component: string; success: boolean; error?: string }> = [];
  const baseDir = path.dirname(stackPath);

  const componentGroups: Array<{ type: string; items: string[] }> = [
    { type: "agent", items: stack.agents },
    { type: "skill", items: stack.skills },
    { type: "command", items: stack.commands },
    { type: "hook", items: stack.hooks },
    { type: "setting", items: stack.settings },
  ];

  for (const group of componentGroups) {
    for (const item of group.items) {
      const componentPath = path.isAbsolute(item) ? item : path.join(baseDir, item);
      const result = installFromPath(componentPath);
      results.push({
        component: item,
        success: result.success,
        error: result.error,
      });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  logger.info("Stack installed", { stack: stack.name, succeeded, failed });

  return {
    success: failed === 0,
    data: { stack: stack.name, results, succeeded, failed },
    ...(failed > 0 ? { error: `${failed} component(s) failed to install` } : {}),
  };
}

/**
 * List available stacks in a directory.
 * @param stacksDir - Directory to scan.
 * @returns Tool result with stack names and descriptions.
 */
export function listStacks(stacksDir: string = path.join(process.cwd(), "stacks")): ToolResult {
  if (!fs.existsSync(stacksDir)) {
    return { success: true, data: { stacks: [] } };
  }

  const stacks = fs.readdirSync(stacksDir)
    .filter(f => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map(f => {
      const def = loadStack(path.join(stacksDir, f));
      return def ? { name: def.name, description: def.description } : null;
    })
    .filter(Boolean);

  return { success: true, data: { stacks } };
}
