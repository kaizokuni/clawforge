/**
 * Integration tests: verify key modules import and export correctly.
 * Does not require database or external services.
 */
import { describe, it, expect } from "vitest";

describe("shared modules", () => {
  it("imports constants without error", async () => {
    const mod = await import("../src/shared/constants.js");
    expect(mod.VERSION).toBeTruthy();
    expect(mod.APP_NAME).toBe("clawforge");
    expect(mod.CLAWFORGE_HOME).toBeTruthy();
  });

  it("imports types without error", async () => {
    // types.ts is compile-time only, but we can import it
    const mod = await import("../src/shared/types.js");
    expect(mod.ConfigSchema).toBeTruthy();
  });

  it("imports platform utilities", async () => {
    const mod = await import("../src/shared/platform.js");
    expect(typeof mod.detectPlatform).toBe("function");
    expect(typeof mod.normalizePath).toBe("function");
    const platform = mod.detectPlatform();
    expect(["windows", "macos", "linux"]).toContain(platform);
  });
});

describe("tool modules export expected functions", () => {
  it("marketplace validator exports validateComponent", async () => {
    const mod = await import("../src/tools/marketplace/validator.js");
    expect(typeof mod.validateComponent).toBe("function");
  });

  it("marketplace searcher exports searchMarketplace", async () => {
    const mod = await import("../src/tools/marketplace/searcher.js");
    expect(typeof mod.searchMarketplace).toBe("function");
    expect(typeof mod.getFeatured).toBe("function");
  });

  it("settings applier exports key functions", async () => {
    const mod = await import("../src/tools/settings/applier.js");
    expect(typeof mod.applyPreset).toBe("function");
    expect(typeof mod.clearPreset).toBe("function");
    expect(typeof mod.checkToolAllowed).toBe("function");
    expect(typeof mod.getActivePreset).toBe("function");
  });

  it("commands executor exports runCommand and listCommands", async () => {
    const mod = await import("../src/tools/commands/executor.js");
    expect(typeof mod.runCommand).toBe("function");
    expect(typeof mod.listCommands).toBe("function");
  });

  it("hooks executor exports executeHook, triggerHook, listHooks", async () => {
    const mod = await import("../src/tools/hooks/executor.js");
    expect(typeof mod.executeHook).toBe("function");
    expect(typeof mod.triggerHook).toBe("function");
    expect(typeof mod.listHooks).toBe("function");
  });

  it("skills executor exports runSkill and listSkills", async () => {
    const mod = await import("../src/tools/skills/executor.js");
    expect(typeof mod.runSkill).toBe("function");
    expect(typeof mod.listSkills).toBe("function");
    expect(typeof mod.installSkill).toBe("function");
  });

  it("workflows runner exports runWorkflow and listWorkflows", async () => {
    const mod = await import("../src/tools/workflows/runner.js");
    expect(typeof mod.runWorkflow).toBe("function");
    expect(typeof mod.listWorkflows).toBe("function");
  });

  it("indexer chunker exports chunkFile and chunkFiles", async () => {
    const mod = await import("../src/tools/indexer/chunker.js");
    expect(typeof mod.chunkFile).toBe("function");
    expect(typeof mod.chunkFiles).toBe("function");
  });

  it("agents loader exports loadAgents and loadAgent", async () => {
    const mod = await import("../src/tools/agents/loader.js");
    expect(typeof mod.loadAgents).toBe("function");
    expect(typeof mod.loadAgent).toBe("function");
  });

  it("cron scheduler exports key functions", async () => {
    const mod = await import("../src/tools/cron/scheduler.js");
    expect(typeof mod.scheduleJob).toBe("function");
    expect(typeof mod.listJobs).toBe("function");
    expect(typeof mod.removeJob).toBe("function");
  });
});

describe("CLI modules export command builders", () => {
  it("setup CLI exports makeSetupCommand", async () => {
    const mod = await import("../src/cli/setup.js");
    expect(typeof mod.makeSetupCommand).toBe("function");
  });

  it("init CLI exports makeInitCommand", async () => {
    const mod = await import("../src/cli/init.js");
    expect(typeof mod.makeInitCommand).toBe("function");
  });

  it("skill CLI exports makeSkillCommand", async () => {
    const mod = await import("../src/cli/skill.js");
    expect(typeof mod.makeSkillCommand).toBe("function");
  });
});
