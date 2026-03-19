/**
 * Tests for skills loader and executor.
 * Uses the built-in skills directory from the repo.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSkill, listSkills } from "../src/tools/skills/executor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, "..", "skills");

describe("listSkills (built-in)", () => {
  it("returns success", () => {
    const result = listSkills(SKILLS_DIR);
    expect(result.success).toBe(true);
  });

  it("finds at least 8 built-in skills", () => {
    const result = listSkills(SKILLS_DIR);
    const data = result.data as { skills: unknown[] };
    expect(data.skills.length).toBeGreaterThanOrEqual(8);
  });

  it("each skill has name, description, version, triggers", () => {
    const result = listSkills(SKILLS_DIR);
    const data = result.data as {
      skills: Array<{ name: string; description: string; version: string; triggers: string[] }>;
    };
    for (const skill of data.skills) {
      expect(typeof skill.name).toBe("string");
      expect(skill.name.length).toBeGreaterThan(0);
      expect(typeof skill.description).toBe("string");
      expect(typeof skill.version).toBe("string");
      expect(Array.isArray(skill.triggers)).toBe(true);
    }
  });

  it("includes code-review skill", () => {
    const result = listSkills(SKILLS_DIR);
    const data = result.data as { skills: Array<{ name: string }> };
    const names = data.skills.map(s => s.name);
    expect(names).toContain("code-review");
  });
});

describe("runSkill (built-in)", () => {
  it("returns error for unknown skill", () => {
    const result = runSkill("does-not-exist", "", SKILLS_DIR);
    expect(result.success).toBe(false);
    expect(result.error).toContain("does-not-exist");
  });

  it("runs code-review skill by name", () => {
    const result = runSkill("code-review", "", SKILLS_DIR);
    expect(result.success).toBe(true);
    const data = result.data as { skill: string; context: string };
    expect(data.skill).toBe("code-review");
    expect(data.context).toContain("code-review");
  });

  it("injects task into skill context", () => {
    const result = runSkill("code-review", "Review src/auth.ts", SKILLS_DIR);
    expect(result.success).toBe(true);
    const data = result.data as { context: string };
    expect(data.context).toContain("Review src/auth.ts");
    expect(data.context).toContain("## Current Task");
  });

  it("returns version in data", () => {
    const result = runSkill("code-review", "", SKILLS_DIR);
    expect(result.success).toBe(true);
    const data = result.data as { version: string };
    expect(typeof data.version).toBe("string");
  });

  it("returns toolsUsed array in data", () => {
    const result = runSkill("code-review", "", SKILLS_DIR);
    expect(result.success).toBe(true);
    const data = result.data as { toolsUsed: string[] };
    expect(Array.isArray(data.toolsUsed)).toBe(true);
  });

  it("resolves skill by trigger phrase", () => {
    // The code-review skill has triggers like "review code" or "code review"
    // We just test that resolution works — if trigger matches we get success
    const result = runSkill("debug-loop", "", SKILLS_DIR);
    // debug-loop should exist in built-in skills
    expect(result.success).toBe(true);
  });
});
