/**
 * Skills resolver.
 * Match user input to a skill by name or trigger phrases.
 */

import { loadSkills } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { SkillDefinition } from "../../shared/types.js";

/**
 * Find the best matching skill for a given input.
 * @param input - User input or skill name.
 * @param localDir - Local skills directory.
 * @returns Matching skill or null.
 */
export function resolveSkill(input: string, localDir?: string): SkillDefinition | null {
  const skills = loadSkills(localDir);
  if (skills.length === 0) return null;

  const normalized = input.toLowerCase().trim();

  // 1. Exact name match
  const byName = skills.find(s => s.name.toLowerCase() === normalized);
  if (byName) return byName;

  // 2. Trigger phrase match (any trigger substring found in input)
  for (const skill of skills) {
    for (const trigger of skill.triggers) {
      if (normalized.includes(trigger.toLowerCase())) {
        logger.debug("Skill matched by trigger", { skill: skill.name, trigger });
        return skill;
      }
    }
  }

  // 3. Name contains input or input contains name
  const byPartial = skills.find(s =>
    normalized.includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(normalized)
  );
  if (byPartial) return byPartial;

  // 4. Keyword overlap with description
  const scored = skills.map(skill => {
    const words = (skill.description + " " + skill.triggers.join(" ")).toLowerCase().split(/\W+/);
    const inputWords = normalized.split(/\W+/);
    const score = inputWords.filter(w => w.length > 3 && words.includes(w)).length;
    return { skill, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (best && best.score > 0) return best.skill;

  return null;
}
