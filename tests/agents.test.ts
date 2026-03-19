/**
 * Tests for the agent loader.
 * Uses built-in agents directory from the repo.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAgents, loadAgent } from "../src/tools/agents/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.join(__dirname, "..", "agents");

describe("loadAgents (built-in)", () => {
  it("returns an array of agents", () => {
    const agents = loadAgents(AGENTS_DIR);
    expect(Array.isArray(agents)).toBe(true);
  });

  it("finds at least 8 built-in agents", () => {
    const agents = loadAgents(AGENTS_DIR);
    expect(agents.length).toBeGreaterThanOrEqual(8);
  });

  it("each agent has name, description, systemPrompt", () => {
    const agents = loadAgents(AGENTS_DIR);
    for (const agent of agents) {
      expect(typeof agent.name).toBe("string");
      expect(agent.name.length).toBeGreaterThan(0);
      expect(typeof agent.description).toBe("string");
      expect(typeof agent.systemPrompt).toBe("string");
    }
  });

  it("each agent has a tools array", () => {
    const agents = loadAgents(AGENTS_DIR);
    for (const agent of agents) {
      expect(Array.isArray(agent.tools)).toBe(true);
    }
  });

  it("includes frontend-designer agent", () => {
    const agents = loadAgents(AGENTS_DIR);
    const names = agents.map(a => a.name);
    expect(names).toContain("frontend-designer");
  });

  it("includes security-auditor agent", () => {
    const agents = loadAgents(AGENTS_DIR);
    const names = agents.map(a => a.name);
    expect(names).toContain("security-auditor");
  });
});

describe("loadAgent (built-in)", () => {
  it("finds agent by name", () => {
    const agent = loadAgent("backend-architect", AGENTS_DIR);
    expect(agent).not.toBeNull();
    expect(agent?.name).toBe("backend-architect");
  });

  it("returns null for nonexistent agent", () => {
    const agent = loadAgent("does-not-exist", AGENTS_DIR);
    expect(agent).toBeNull();
  });

  it("agent system prompt is non-empty", () => {
    const agent = loadAgent("code-reviewer", AGENTS_DIR);
    expect(agent?.systemPrompt).toBeTruthy();
    expect(agent!.systemPrompt.length).toBeGreaterThan(50);
  });
});
