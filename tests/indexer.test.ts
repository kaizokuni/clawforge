/**
 * Tests for the file chunker.
 * Creates temp files and validates chunking behavior.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { chunkFile, chunkFiles } from "../src/tools/indexer/chunker.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-indexer-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFile(name: string, content: string): string {
  const fp = path.join(tmpDir, name);
  fs.writeFileSync(fp, content, "utf-8");
  return fp;
}

describe("chunkFile", () => {
  it("returns empty array for non-existent file", () => {
    const chunks = chunkFile(path.join(tmpDir, "nope.ts"));
    expect(chunks).toEqual([]);
  });

  it("returns empty array for empty file", () => {
    const fp = writeFile("empty.ts", "");
    const chunks = chunkFile(fp);
    expect(chunks).toEqual([]);
  });

  it("returns one chunk for small file", () => {
    const fp = writeFile("small.ts", "const x = 1;\nconst y = 2;\n");
    const chunks = chunkFile(fp);
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.text).toContain("const x");
  });

  it("chunk has correct filePath", () => {
    const fp = writeFile("test.ts", "export const foo = 'bar';\n");
    const chunks = chunkFile(fp);
    expect(chunks[0]!.filePath).toBe(fp);
  });

  it("chunk has startLine and endLine", () => {
    const fp = writeFile("lined.ts", "line1\nline2\nline3\n");
    const chunks = chunkFile(fp);
    expect(typeof chunks[0]!.startLine).toBe("number");
    expect(typeof chunks[0]!.endLine).toBe("number");
    expect(chunks[0]!.startLine).toBeGreaterThanOrEqual(1);
    expect(chunks[0]!.endLine).toBeGreaterThanOrEqual(chunks[0]!.startLine);
  });

  it("splits large file into multiple chunks", () => {
    // 500 tokens * 4 chars = 2000 chars per chunk; write 5000 chars
    const line = "export function example() { return 'hello world from function'; }\n"; // ~68 chars
    const content = line.repeat(80); // ~5400 chars — should produce 2+ chunks
    const fp = writeFile("large.ts", content);
    const chunks = chunkFile(fp);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("chunk text contains actual content", () => {
    const fp = writeFile("content.ts", "export const MAGIC = 42;\n");
    const chunks = chunkFile(fp);
    expect(chunks[0]!.text).toContain("MAGIC");
  });

  it("respects custom targetTokens parameter", () => {
    const line = "const x = 1;\n";
    const content = line.repeat(20); // 280 chars
    const fp = writeFile("custom.ts", content);

    const bigChunks = chunkFile(fp, 1000); // 4000 chars — all fits in one
    const smallChunks = chunkFile(fp, 5);  // 20 chars — many chunks

    expect(bigChunks.length).toBeLessThanOrEqual(smallChunks.length);
  });
});

describe("chunkFiles", () => {
  it("returns all chunks from multiple files", () => {
    const fp1 = writeFile("a.ts", "const a = 1;\n");
    const fp2 = writeFile("b.ts", "const b = 2;\n");
    const chunks = chunkFiles([fp1, fp2]);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const filePaths = new Set(chunks.map(c => c.filePath));
    expect(filePaths.has(fp1)).toBe(true);
    expect(filePaths.has(fp2)).toBe(true);
  });

  it("returns empty array for no files", () => {
    const chunks = chunkFiles([]);
    expect(chunks).toEqual([]);
  });

  it("skips non-existent files gracefully", () => {
    const real = writeFile("real.ts", "const x = 1;\n");
    const chunks = chunkFiles([real, path.join(tmpDir, "ghost.ts")]);
    expect(chunks.length).toBeGreaterThan(0);
    // All chunks should be from the real file
    expect(chunks.every(c => c.filePath === real)).toBe(true);
  });
});
