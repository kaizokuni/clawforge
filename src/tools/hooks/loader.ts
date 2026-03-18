/**
 * Hooks loader.
 * Discovers .md files in ~/.clawforge/hooks/ and ./hooks/.
 * Parses frontmatter: name, description, trigger, conditions, action (body).
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { HOOKS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { HookDefinition, HookTrigger } from "../../shared/types.js";

const VALID_TRIGGERS: HookTrigger[] = [
  "pre-commit",
  "pre-push",
  "post-edit",
  "file-change",
  "on-error",
  "on-session-start",
  "on-session-end",
  "on-test-fail",
];

/**
 * Load all hooks from global and local directories.
 * @param localDir - Optional local hooks directory (e.g. ./hooks/).
 * @returns Array of HookDefinition.
 */
export function loadHooks(localDir?: string): HookDefinition[] {
  const dirs: string[] = [HOOKS_DIR];
  if (localDir) dirs.push(localDir);

  const seen = new Set<string>();
  const hooks: HookDefinition[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);

        const name: string = data["name"] ?? path.basename(file, ".md");
        if (seen.has(name)) continue;
        seen.add(name);

        const trigger = data["trigger"] as HookTrigger;
        if (!VALID_TRIGGERS.includes(trigger)) {
          logger.warn("Hook has unknown trigger, skipping", { file, trigger });
          continue;
        }

        hooks.push({
          name,
          description: data["description"] ?? "",
          trigger,
          conditions: (data["conditions"] as Record<string, string>) ?? {},
          action: content.trim(),
        });
      } catch (err) {
        logger.warn("Failed to load hook file", { file: filePath, error: String(err) });
      }
    }
  }

  logger.info("Hooks loaded", { count: hooks.length });
  return hooks;
}

/**
 * Load hooks that match a specific trigger type.
 * @param trigger - The trigger type to filter by.
 * @param localDir - Optional local hooks directory.
 * @returns Matching hooks.
 */
export function loadHooksByTrigger(trigger: HookTrigger, localDir?: string): HookDefinition[] {
  return loadHooks(localDir).filter(h => h.trigger === trigger);
}
