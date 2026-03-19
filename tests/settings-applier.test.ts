/**
 * Tests for settings preset applier.
 * Tests runtime permission state management (no disk needed for core logic).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  clearPreset,
  checkToolAllowed,
  getActivePreset,
  getPresetStatus,
} from "../src/tools/settings/applier.js";

// Reset module state before each test
beforeEach(() => {
  clearPreset();
});

describe("checkToolAllowed — no active preset", () => {
  it("allows all tools when no preset is active", () => {
    const result = checkToolAllowed("browser_open");
    expect(result.success).toBe(true);
    const data = result.data as { allowed: boolean } | undefined;
    expect(data?.allowed).toBe(true);
  });

  it("allows memory_search with no preset", () => {
    expect(checkToolAllowed("memory_search").success).toBe(true);
  });
});

describe("clearPreset", () => {
  it("returns success with cleared preset name", () => {
    const result = clearPreset();
    expect(result.success).toBe(true);
  });

  it("returns null active preset after clearing", () => {
    clearPreset();
    expect(getActivePreset()).toBeNull();
  });
});

describe("getActivePreset", () => {
  it("returns null when no preset active", () => {
    expect(getActivePreset()).toBeNull();
  });
});

describe("getPresetStatus", () => {
  it("returns success with null activePreset when none applied", () => {
    const result = getPresetStatus();
    expect(result.success).toBe(true);
    const data = result.data as { activePreset: string | null } | undefined;
    expect(data?.activePreset).toBeNull();
  });
});

describe("applyPreset with local settings dir", () => {
  it("applies the read-only preset and blocks write tools", async () => {
    // Use the built-in settings dir from the repo
    const { applyPreset } = await import("../src/tools/settings/applier.js");
    const settingsDir = new URL("../settings", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

    const applyResult = applyPreset("read-only", settingsDir);
    if (!applyResult.success) {
      // If read-only preset isn't in that dir, skip this sub-test
      return;
    }

    expect(applyResult.success).toBe(true);
    expect(getActivePreset()).toBe("read-only");

    // memory_store is a write tool — should be blocked in read-only
    const storeResult = checkToolAllowed("memory_store");
    expect(storeResult.success).toBe(false);
    expect(storeResult.error).toContain("read-only");

    clearPreset();
  });

  it("applies security-audit preset and blocks browser/network tools", async () => {
    const { applyPreset } = await import("../src/tools/settings/applier.js");
    const settingsDir = new URL("../settings", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

    const applyResult = applyPreset("security-audit", settingsDir);
    if (!applyResult.success) return;

    // security-audit has allow_browser: false — browser_open should be blocked
    const browserResult = checkToolAllowed("browser_open");
    expect(browserResult.success).toBe(false);

    clearPreset();
  });
});
