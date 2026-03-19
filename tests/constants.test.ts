/**
 * Tests for shared constants.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";

// We test that the constants file exports the right values and shapes
import {
  VERSION,
  APP_NAME,
  CLAWFORGE_HOME,
  MONITOR_PORT,
  MCP_HUB_PORT,
  MAX_BROWSER_PAGES,
  BROWSER_TIMEOUT,
  COMPRESS_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
  REQUIRED_DIRS,
} from "../src/shared/constants.js";

describe("constants", () => {
  it("exports a version string", () => {
    expect(typeof VERSION).toBe("string");
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exports APP_NAME as clawforge", () => {
    expect(APP_NAME).toBe("clawforge");
  });

  it("CLAWFORGE_HOME is inside home directory", () => {
    const home = os.homedir();
    expect(CLAWFORGE_HOME).toContain(".clawforge");
    expect(CLAWFORGE_HOME.startsWith(home)).toBe(true);
  });

  it("MONITOR_PORT is a valid port number", () => {
    expect(MONITOR_PORT).toBeGreaterThan(1024);
    expect(MONITOR_PORT).toBeLessThan(65535);
  });

  it("MCP_HUB_PORT is different from MONITOR_PORT", () => {
    expect(MCP_HUB_PORT).not.toBe(MONITOR_PORT);
  });

  it("MAX_BROWSER_PAGES is at least 1", () => {
    expect(MAX_BROWSER_PAGES).toBeGreaterThanOrEqual(1);
  });

  it("BROWSER_TIMEOUT is in milliseconds (>= 5000)", () => {
    expect(BROWSER_TIMEOUT).toBeGreaterThanOrEqual(5000);
  });

  it("COMPRESS_BATCH_SIZE is at least 1", () => {
    expect(COMPRESS_BATCH_SIZE).toBeGreaterThanOrEqual(1);
  });

  it("EMBEDDING_DIMENSIONS is 768 (nomic-embed-text)", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(768);
  });

  it("REQUIRED_DIRS includes CLAWFORGE_HOME", () => {
    const dirs = REQUIRED_DIRS as readonly string[];
    expect(dirs).toContain(CLAWFORGE_HOME);
  });

  it("REQUIRED_DIRS contains only strings using path separators", () => {
    const dirs = REQUIRED_DIRS as readonly string[];
    for (const dir of dirs) {
      expect(typeof dir).toBe("string");
      // Should be an absolute path
      expect(path.isAbsolute(dir)).toBe(true);
    }
  });

  it("REQUIRED_DIRS has at least 10 entries", () => {
    expect((REQUIRED_DIRS as readonly string[]).length).toBeGreaterThanOrEqual(10);
  });
});
