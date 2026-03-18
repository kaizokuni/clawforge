/**
 * File chunker.
 * Split files into ~500 token chunks with overlap for embedding.
 */

import fs from "node:fs";
import { logger } from "../../shared/logger.js";

/** A single chunk from a file. */
export interface Chunk {
  filePath: string;
  text: string;
  startLine: number;
  endLine: number;
}

/** Approximate tokens per character (rough estimate). */
const CHARS_PER_TOKEN = 4;
const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

/**
 * Read a file and split it into overlapping chunks.
 * @param filePath - Path to the file.
 * @param targetTokens - Target tokens per chunk.
 * @returns Array of chunks.
 */
export function chunkFile(filePath: string, targetTokens: number = TARGET_TOKENS): Chunk[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.length === 0) return [];

    const targetChars = targetTokens * CHARS_PER_TOKEN;
    const lines = content.split("\n");
    const chunks: Chunk[] = [];

    let currentChunk = "";
    let startLine = 1;
    let currentLine = 1;

    for (const line of lines) {
      currentChunk += line + "\n";

      if (currentChunk.length >= targetChars) {
        chunks.push({
          filePath,
          text: currentChunk.trim(),
          startLine,
          endLine: currentLine,
        });

        // Overlap: keep last N chars for context
        const overlapStart = Math.max(0, currentChunk.length - OVERLAP_CHARS);
        currentChunk = currentChunk.slice(overlapStart);
        startLine = Math.max(1, currentLine - Math.floor(OVERLAP_CHARS / 80));
      }

      currentLine++;
    }

    // Final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        filePath,
        text: currentChunk.trim(),
        startLine,
        endLine: currentLine - 1,
      });
    }

    return chunks;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Failed to chunk file", { filePath, error: msg });
    return [];
  }
}

/**
 * Chunk multiple files.
 * @param filePaths - Array of file paths.
 * @returns All chunks from all files.
 */
export function chunkFiles(filePaths: string[]): Chunk[] {
  const allChunks: Chunk[] = [];
  for (const fp of filePaths) {
    allChunks.push(...chunkFile(fp));
  }
  logger.info("Files chunked", { fileCount: filePaths.length, chunkCount: allChunks.length });
  return allChunks;
}
