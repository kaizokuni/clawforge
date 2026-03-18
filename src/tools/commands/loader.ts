/**
 * Slash command loader.
 * Discovers .md files in ~/.clawforge/commands/ and ./commands/.
 * Parses YAML frontmatter: name, description, category. Body = instruction prompt.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { COMMANDS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { CommandDefinition } from "../../shared/types.js";

/**
 * Load all commands from global and local dirs.
 * @param localDir - Optional local commands directory (e.g. ./commands/).
 * @returns Array of CommandDefinition.
 */
export function loadCommands(localDir?: string): CommandDefinition[] {
  const dirs: string[] = [COMMANDS_DIR];
  if (localDir) dirs.push(localDir);

  const seen = new Set<string>();
  const commands: CommandDefinition[] = [];

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

        commands.push({
          name,
          description: data["description"] ?? "",
          category: data["category"] ?? "general",
          instructions: content.trim(),
        });
      } catch (err) {
        logger.warn("Failed to load command file", { file: filePath, error: String(err) });
      }
    }
  }

  logger.info("Commands loaded", { count: commands.length });
  return commands;
}

/**
 * Load a single command by name.
 * @param name - Command name (without .md extension).
 * @param localDir - Optional local commands directory.
 * @returns CommandDefinition or undefined.
 */
export function loadCommand(name: string, localDir?: string): CommandDefinition | undefined {
  return loadCommands(localDir).find(c => c.name === name);
}
