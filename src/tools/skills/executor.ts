/**
 * Skills executor.
 * Load skill's workflow instructions and return as formatted prompt context.
 * Full tool-chaining execution is wired in Phase 5.
 */

import { resolveSkill } from "./resolver.js";
import { loadSkills } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Run a skill by name or trigger input.
 * Returns the skill's instruction prompt as context for the agent.
 * @param nameOrInput - Skill name or trigger input.
 * @param task - The user's specific task to apply the skill to.
 * @param localDir - Local skills directory.
 * @returns Tool result with skill instructions as context.
 */
export function runSkill(
  nameOrInput: string,
  task: string = "",
  localDir?: string
): ToolResult {
  const skill = resolveSkill(nameOrInput, localDir);

  if (!skill) {
    return { success: false, error: `No skill found for: "${nameOrInput}"` };
  }

  logger.info("Skill executed", { name: skill.name, task: task.slice(0, 60) });

  const context = [
    `# Skill: ${skill.name}`,
    `> ${skill.description}`,
    "",
    "## Instructions",
    skill.instructions,
    ...(task ? ["", "## Current Task", task] : []),
    ...(skill.toolsUsed.length > 0 ? ["", `## Tools to Use`, skill.toolsUsed.join(", ")] : []),
  ].join("\n");

  return {
    success: true,
    data: {
      skill: skill.name,
      version: skill.version,
      context,
      toolsUsed: skill.toolsUsed,
    },
  };
}

/**
 * List all available skills.
 * @param localDir - Local skills directory.
 * @returns Tool result with skills array.
 */
export function listSkills(localDir?: string): ToolResult {
  const skills = loadSkills(localDir);
  return {
    success: true,
    data: {
      skills: skills.map(s => ({
        name: s.name,
        description: s.description,
        version: s.version,
        triggers: s.triggers,
      })),
    },
  };
}

/**
 * Install a skill from a directory path.
 * Copies the skill folder to ~/.clawforge/skills/.
 * @param sourcePath - Path to skill directory containing SKILL.md.
 * @returns Tool result.
 */
export function installSkill(sourcePath: string): ToolResult {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const { SKILLS_DIR } = require("../../shared/constants.js") as typeof import("../../shared/constants.js");

  try {
    const skillMd = path.join(sourcePath, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      return { success: false, error: `No SKILL.md found at: ${sourcePath}` };
    }

    const name = path.basename(sourcePath);
    const destDir = path.join(SKILLS_DIR, name);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(skillMd, path.join(destDir, "SKILL.md"));

    logger.info("Skill installed", { name, dest: destDir });
    return { success: true, data: { name, path: destDir } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Install failed: ${msg}` };
  }
}
