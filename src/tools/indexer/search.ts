/**
 * Semantic search across indexed project chunks.
 * Embed query → cosine similarity in project_index table.
 */

import crypto from "node:crypto";
import { embed } from "../memory/embedder.js";
import { insertProjectChunk, searchProjectIndex } from "../memory/vector-store.js";
import { scanDirectory } from "./scanner.js";
import { chunkFiles } from "./chunker.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Index a project directory for semantic search.
 * Scans files, chunks them, embeds, and stores in the vector DB.
 * @param dirPath - Directory to index.
 * @param options - Embedding options.
 * @returns Tool result with indexing stats.
 */
export async function indexProject(
  dirPath: string,
  options?: { ollamaHost?: string; openaiApiKey?: string }
): Promise<ToolResult> {
  try {
    const files = await scanDirectory(dirPath);
    if (files.length === 0) {
      return { success: true, data: { filesIndexed: 0, chunksIndexed: 0 } };
    }

    const chunks = chunkFiles(files);
    let indexed = 0;

    for (const chunk of chunks) {
      try {
        const vector = await embed(chunk.text.slice(0, 1000), options);
        const id = crypto.randomUUID();
        insertProjectChunk(id, chunk.filePath, chunk.text, dirPath, vector);
        indexed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug("Failed to index chunk", { file: chunk.filePath, error: msg });
      }
    }

    logger.info("Project indexed", { dir: dirPath, files: files.length, chunks: indexed });
    return {
      success: true,
      data: { filesIndexed: files.length, chunksIndexed: indexed },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Indexing failed: ${msg}` };
  }
}

/**
 * Semantic search across an indexed project.
 * @param query - Natural language search query.
 * @param limit - Maximum results.
 * @param options - Embedding options.
 * @returns Tool result with matching file chunks.
 */
export async function searchIndex(
  query: string,
  limit: number = 10,
  options?: { ollamaHost?: string; openaiApiKey?: string }
): Promise<ToolResult> {
  try {
    const queryVector = await embed(query, options);
    const results = searchProjectIndex(queryVector, limit);

    logger.info("Index search completed", { query, resultCount: results.length });
    return {
      success: true,
      data: {
        query,
        results: results.map(r => ({
          filePath: r.filePath,
          excerpt: r.chunkText.slice(0, 300),
          score: r.score,
          projectPath: r.projectPath,
        })),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Index search failed: ${msg}` };
  }
}
