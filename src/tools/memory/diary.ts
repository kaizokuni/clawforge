/**
 * Daily diary entry generation.
 * Aggregates the day's summaries into a diary entry.
 */

import crypto from "node:crypto";
import { getDb } from "./vector-store.js";
import { logger } from "../../shared/logger.js";

/**
 * Generate or update a diary entry for a given date.
 * Aggregates all summaries from that day.
 * @param date - Date string in YYYY-MM-DD format. Defaults to today.
 * @returns The diary entry content.
 */
export function generateDiaryEntry(date?: string): string {
  const targetDate = date ?? new Date().toISOString().split("T")[0]!;
  const database = getDb();

  const summaries = database.prepare(`
    SELECT compressed_text, category, created_at
    FROM summaries
    WHERE created_at >= ? AND created_at < date(?, '+1 day')
    ORDER BY created_at
  `).all(targetDate, targetDate) as Array<{
    compressed_text: string;
    category: string;
    created_at: string;
  }>;

  if (summaries.length === 0) {
    return `# ${targetDate}\n\nNo activity recorded.`;
  }

  const content = `# ${targetDate}\n\n## Activity Summary (${summaries.length} sessions)\n\n` +
    summaries.map((s, i) =>
      `### ${i + 1}. [${s.created_at}] (${s.category})\n${s.compressed_text}`
    ).join("\n\n");

  // Upsert diary entry
  const existing = database.prepare(`SELECT id FROM diary WHERE date = ?`).get(targetDate) as { id: string } | undefined;
  if (existing) {
    database.prepare(`UPDATE diary SET content = ? WHERE id = ?`).run(content, existing.id);
  } else {
    database.prepare(`INSERT INTO diary (id, date, content) VALUES (?, ?, ?)`).run(
      crypto.randomUUID(), targetDate, content
    );
  }

  logger.info("Diary entry generated", { date: targetDate, summaryCount: summaries.length });
  return content;
}

/**
 * Get a diary entry for a specific date.
 * @param date - Date string in YYYY-MM-DD format.
 * @returns Diary content or null.
 */
export function getDiaryEntry(date: string): string | null {
  const database = getDb();
  const row = database.prepare(`SELECT content FROM diary WHERE date = ?`).get(date) as { content: string } | undefined;
  return row?.content ?? null;
}

/**
 * List all diary entry dates.
 * @returns Array of date strings.
 */
export function listDiaryDates(): string[] {
  const database = getDb();
  const rows = database.prepare(`SELECT date FROM diary ORDER BY date DESC`).all() as Array<{ date: string }>;
  return rows.map(r => r.date);
}
