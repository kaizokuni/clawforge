/**
 * 3-layer progressive disclosure memory retriever.
 * Layer 1: Lightweight index (IDs + titles + timestamps)
 * Layer 2: Timeline around an observation
 * Layer 3: Full observation details
 */

import { cosineSimilaritySearch, getObservationsByIds, getTimeline, getDb } from "./vector-store.js";
import { embed } from "./embedder.js";
import { logger } from "../../shared/logger.js";
import type { MemorySearchResult, MemoryTimelineEntry } from "../../shared/types.js";

/** Lightweight search result for Layer 1. */
export interface SearchIndex {
  id: string;
  title: string;
  timestamp: string;
  score: number;
  sourceType: "observation" | "summary";
}

/**
 * Layer 1: Semantic search returning a lightweight index.
 * Embeds the query and finds the most similar summaries.
 * @param query - Natural language search query.
 * @param limit - Maximum results.
 * @param options - Embedding options.
 * @returns Array of lightweight index entries.
 */
export async function search(
  query: string,
  limit: number = 10,
  options?: { ollamaHost?: string; openaiApiKey?: string }
): Promise<MemorySearchResult[]> {
  try {
    const queryVector = await embed(query, options);

    // Check if zero vector (no embedding available)
    const isZero = queryVector.every(v => v === 0);
    if (isZero) {
      logger.warn("Zero embedding vector, falling back to text search");
      return textSearch(query, limit);
    }

    return cosineSimilaritySearch(queryVector, limit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Memory search failed", { error: msg });
    return textSearch(query, limit);
  }
}

/**
 * Fallback text-based search when embeddings are unavailable.
 * @param query - Search query.
 * @param limit - Maximum results.
 * @returns Matching summaries.
 */
function textSearch(query: string, limit: number): MemorySearchResult[] {
  try {
    const database = getDb();
    const rows = database.prepare(`
      SELECT id, compressed_text, created_at FROM summaries
      WHERE compressed_text LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(`%${query}%`, limit) as Array<{
      id: string;
      compressed_text: string;
      created_at: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      content: r.compressed_text,
      score: 0.5,
      sourceType: "summary" as const,
      timestamp: r.created_at,
      projectPath: "",
    }));
  } catch {
    return [];
  }
}

/**
 * Layer 2: Get timeline of observations around a given observation.
 * @param observationId - Center observation ID.
 * @param windowSize - Hours before/after to include.
 * @returns Timeline entries.
 */
export function timeline(observationId: string, windowSize: number = 5): MemoryTimelineEntry[] {
  return getTimeline(observationId, windowSize);
}

/**
 * Layer 3: Get full observation details by IDs.
 * @param ids - Array of observation IDs.
 * @returns Full observation data.
 */
export function getFullObservations(ids: string[]): Array<{
  id: string;
  timestamp: string;
  type: string;
  title: string;
  content: string;
  session_id: string;
  project_path: string;
}> {
  return getObservationsByIds(ids);
}
