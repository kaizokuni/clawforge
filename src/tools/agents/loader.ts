/**
 * Agent definition loader.
 * Discovers .md files in ./agents/ and ~/.clawforge/agents/, parses YAML frontmatter.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { AGENTS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { AgentDefinition } from "../../shared/types.js";

/**
 * Load all agent definitions from local and user-level agent directories.
 * @param localDir - Local project agents directory (default: ./agents).
 * @returns Array of parsed agent definitions.
 */
export function loadAgents(localDir: string = "./agents"): AgentDefinition[] {
  const dirs = [localDir, AGENTS_DIR];
  const agents: AgentDefinition[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f =>
      f.endsWith(".md") && f !== "AGENTS.md"
    );

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);

        const name = (data["name"] as string | undefined) ?? path.basename(file, ".md");
        if (seen.has(name)) continue;
        seen.add(name);

        agents.push({
          name,
          description: (data["description"] as string | undefined) ?? "",
          tools: (data["tools"] as string[] | undefined) ?? [],
          model: (data["model"] as string | undefined) ?? "claude-sonnet-4-20250514",
          systemPrompt: content.trim(),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn("Failed to load agent", { file: filePath, error: msg });
      }
    }
  }

  logger.info("Agents loaded", { count: agents.length });
  return agents;
}

/**
 * Load a single agent by name.
 * @param name - Agent name to look up.
 * @param localDir - Local agents directory.
 * @returns The agent definition, or null if not found.
 */
export function loadAgent(name: string, localDir: string = "./agents"): AgentDefinition | null {
  const agents = loadAgents(localDir);
  return agents.find(a => a.name === name) ?? null;
}
