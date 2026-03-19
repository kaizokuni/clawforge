/**
 * Tests for the hook loader and executor.
 * Creates temp hook files and tests loading, interpolation, execution.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { executeHook, triggerHook, listHooks } from "../src/tools/hooks/executor.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-hook-test-"));
  fs.writeFileSync(path.join(tmpDir, "pre-commit.md"), `---
name: pre-commit-check
description: Validate code before commit
trigger: pre-commit
conditions:
  - "*.ts"
---

Check {{files}} for TypeScript errors before committing to {{branch}}.
Run type-check and lint.
`, "utf-8");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("listHooks", () => {
  it("returns success", () => {
    const result = listHooks(tmpDir);
    expect(result.success).toBe(true);
  });

  it("discovers hook from localDir", () => {
    const result = listHooks(tmpDir);
    const data = result.data as { hooks: Array<{ name: string }> };
    const names = data.hooks.map(h => h.name);
    expect(names).toContain("pre-commit-check");
  });

  it("includes trigger and conditions", () => {
    const result = listHooks(tmpDir);
    const data = result.data as { hooks: Array<{ name: string; trigger: string; conditions: string[] }> };
    const hook = data.hooks.find(h => h.name === "pre-commit-check");
    expect(hook?.trigger).toBe("pre-commit");
    expect(hook?.conditions).toContain("*.ts");
  });
});

describe("executeHook", () => {
  it("returns error for unknown hook", () => {
    const result = executeHook("nonexistent", {}, tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toContain("nonexistent");
  });

  it("returns success and prompt for known hook", () => {
    const result = executeHook("pre-commit-check", {}, tmpDir);
    expect(result.success).toBe(true);
    const data = result.data as { hook: string; trigger: string; prompt: string };
    expect(data.hook).toBe("pre-commit-check");
    expect(data.trigger).toBe("pre-commit");
    expect(data.prompt).toContain("pre-commit-check");
  });

  it("interpolates context variables into action", () => {
    const result = executeHook("pre-commit-check", {
      files: "src/auth.ts src/user.ts",
      branch: "feature/login",
    }, tmpDir);
    expect(result.success).toBe(true);
    const data = result.data as { prompt: string };
    expect(data.prompt).toContain("src/auth.ts src/user.ts");
    expect(data.prompt).toContain("feature/login");
  });

  it("leaves unmatched placeholders intact", () => {
    const result = executeHook("pre-commit-check", {}, tmpDir);
    const data = result.data as { prompt: string };
    // {{files}} wasn't replaced, so it should still be in prompt
    expect(data.prompt).toContain("{{files}}");
  });

  it("includes context key-value section when context provided", () => {
    const result = executeHook("pre-commit-check", { files: "src/index.ts" }, tmpDir);
    const data = result.data as { prompt: string };
    expect(data.prompt).toContain("## Context");
    expect(data.prompt).toContain("files: src/index.ts");
  });
});

describe("triggerHook (alias)", () => {
  it("behaves identically to executeHook", () => {
    const exec = executeHook("pre-commit-check", { files: "x.ts" }, tmpDir);
    const trig = triggerHook("pre-commit-check", { files: "x.ts" }, tmpDir);
    expect(exec.success).toBe(trig.success);
    const d1 = exec.data as { hook: string } | undefined;
    const d2 = trig.data as { hook: string } | undefined;
    expect(d1?.hook).toBe(d2?.hook);
  });
});
