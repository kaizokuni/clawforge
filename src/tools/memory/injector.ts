/**
 * Auto-inject memory context at session start.
 * Reads recent summaries, formats as lightweight index.
 */

import { getDb } from "./vector-store.js";
import { logger } from "../../shared/logger.js";

/** Lightweight context entry for injection. */
export interface ContextEntry {
  timestamp: string;
  summary: string;
  category: string;
}

/**
 * Get recent summaries for context injection.
 * @param limit - Maximum number of recent summaries.
 * @param projectPath - Optional filter by project path.
 * @returns Array of context entries.
 */
export function getRecentContext(limit: number = 20, projectPath?: string): ContextEntry[] {
  try {
    const database = getDb();

    let rows: Array<{ compressed_text: string; category: string; created_at: string }>;
    if (projectPath) {
      rows = database.prepare(`
        SELECT s.compressed_text, s.category, s.created_at
        FROM summaries s
        JOIN observations o ON JSON_EXTRACT(s.observation_ids, '$[0]') = o.id
        WHERE o.project_path = ?
        ORDER BY s.created_at DESC
        LIMIT ?
      `).all(projectPath, limit) as typeof rows;
    } else {
      rows = database.prepare(`
        SELECT compressed_text, category, created_at
        FROM summaries
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit) as typeof rows;
    }

    return rows.map(r => ({
      timestamp: r.created_at,
      summary: r.compressed_text.slice(0, 200),
      category: r.category,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Failed to get recent context", { error: msg });
    return [];
  }
}

/**
 * Format context entries as a compact string for injection.
 * @param entries - Context entries to format.
 * @returns Formatted context string.
 */
export function formatContextForInjection(entries: ContextEntry[]): string {
  if (entries.length === 0) return "";
  const lines = entries.map(e => `[${e.timestamp}] (${e.category}) ${e.summary}`);
  return `## Recent Memory\n${lines.join("\n")}`;
}
