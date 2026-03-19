/**
 * Tests for the slash command loader and executor.
 * Creates temp command files and tests discovery, loading, execution.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runCommand, listCommands } from "../src/tools/commands/executor.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-cmd-test-"));
  // Write a fixture command file
  fs.writeFileSync(path.join(tmpDir, "my-command.md"), `---
name: my-command
description: Generate tests for the current file
category: testing
---

Review the provided code and generate comprehensive unit tests using the project's test framework.
Cover happy paths, edge cases, and error conditions.
`, "utf-8");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("listCommands", () => {
  it("returns success with commands array", () => {
    const result = listCommands(tmpDir);
    expect(result.success).toBe(true);
  });

  it("discovers command from localDir", () => {
    const result = listCommands(tmpDir);
    const data = result.data as { commands: Array<{ name: string }> };
    const names = data.commands.map(c => c.name);
    expect(names).toContain("my-command");
  });

  it("includes description and category for each command", () => {
    const result = listCommands(tmpDir);
    const data = result.data as { commands: Array<{ name: string; description: string; category: string }> };
    const cmd = data.commands.find(c => c.name === "my-command");
    expect(cmd).toBeDefined();
    expect(cmd?.description).toBe("Generate tests for the current file");
    expect(cmd?.category).toBe("testing");
  });
});

describe("runCommand", () => {
  it("returns error for unknown command", () => {
    const result = runCommand("nonexistent", "", tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toContain("nonexistent");
  });

  it("returns success and context for known command", () => {
    const result = runCommand("my-command", "", tmpDir);
    expect(result.success).toBe(true);
    const data = result.data as { command: string; context: string; category: string };
    expect(data.command).toBe("my-command");
    expect(data.context).toContain("my-command");
    expect(data.context).toContain("Generate tests");
  });

  it("strips leading slash from command name", () => {
    const result = runCommand("/my-command", "", tmpDir);
    expect(result.success).toBe(true);
  });

  it("injects task context when provided", () => {
    const result = runCommand("my-command", "Review src/auth.ts", tmpDir);
    expect(result.success).toBe(true);
    const data = result.data as { context: string };
    expect(data.context).toContain("Review src/auth.ts");
  });

  it("includes category in returned data", () => {
    const result = runCommand("my-command", "", tmpDir);
    const data = result.data as { category: string };
    expect(data.category).toBe("testing");
  });

  it("returns instructions in context", () => {
    const result = runCommand("my-command", "", tmpDir);
    const data = result.data as { context: string };
    expect(data.context).toContain("Cover happy paths");
  });
});

describe("command with default category", () => {
  it("defaults to general category when not specified", () => {
    fs.writeFileSync(path.join(tmpDir, "minimal.md"), `---
name: minimal
description: A minimal command
---
Do something.
`, "utf-8");

    const result = runCommand("minimal", "", tmpDir);
    expect(result.success).toBe(true);
    const data = result.data as { category: string };
    expect(data.category).toBe("general");
  });
});
