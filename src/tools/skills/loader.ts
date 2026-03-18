/**
 * Skills loader.
 * Discovers SKILL.md files in ./skills/ and ~/.clawforge/skills/, parses Antigravity-compatible frontmatter.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { SKILLS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { SkillDefinition } from "../../shared/types.js";

/**
 * Load all skill definitions from local and user-level skill directories.
 * @param localDir - Local project skills directory (default: ./skills).
 * @returns Array of parsed skill definitions.
 */
export function loadSkills(localDir: string = "./skills"): SkillDefinition[] {
  const dirs = [localDir, SKILLS_DIR];
  const skills: SkillDefinition[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    // Skills are in subdirectories with SKILL.md files
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillMdPath = path.join(dir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillMdPath)) continue;

      try {
        const raw = fs.readFileSync(skillMdPath, "utf-8");
        const { data, content } = matter(raw);

        const name = (data["name"] as string | undefined) ?? entry.name;
        if (seen.has(name)) continue;
        seen.add(name);

        skills.push({
          name,
          description: (data["description"] as string | undefined) ?? "",
          version: (data["version"] as string | undefined) ?? "1.0.0",
          triggers: (data["triggers"] as string[] | undefined) ?? [],
          toolsUsed: (data["tools_used"] as string[] | undefined) ?? [],
          instructions: content.trim(),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn("Failed to load skill", { path: skillMdPath, error: msg });
      }
    }
  }

  logger.info("Skills loaded", { count: skills.length });
  return skills;
}

/**
 * Load a single skill by name.
 * @param name - Skill name.
 * @param localDir - Local skills directory.
 * @returns Skill definition or null.
 */
export function loadSkill(name: string, localDir: string = "./skills"): SkillDefinition | null {
  return loadSkills(localDir).find(s => s.name === name) ?? null;
}
