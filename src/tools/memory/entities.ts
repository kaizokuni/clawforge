/**
 * Entity extraction and tracking.
 * Extract people, projects, preferences from summaries.
 */

import crypto from "node:crypto";
import { getDb } from "./vector-store.js";
import { logger } from "../../shared/logger.js";
import type { Entity } from "../../shared/types.js";

/**
 * Upsert an entity into the database.
 * @param name - Entity name.
 * @param entityType - Entity type.
 * @param project - Associated project path.
 */
export function upsertEntity(name: string, entityType: Entity["entityType"], project: string): void {
  const database = getDb();
  const now = new Date().toISOString();
  const existing = database.prepare(`SELECT id, mention_count FROM entities WHERE name = ? AND type = ?`).get(name, entityType) as { id: string; mention_count?: number } | undefined;

  if (existing) {
    database.prepare(`UPDATE entities SET last_seen = ? WHERE id = ?`).run(now, existing.id);
  } else {
    database.prepare(`
      INSERT INTO entities (id, name, type, project, first_seen, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), name, entityType, project, now, now);
  }
}

/**
 * Extract entities from summary text using simple heuristics.
 * @param summaryText - The summary to extract from.
 * @param projectPath - Associated project path.
 * @returns Array of extracted entity names.
 */
export function extractEntities(summaryText: string, projectPath: string): string[] {
  const extracted: string[] = [];

  // Extract file paths
  const filePattern = /(?:[\w./\\-]+\.(?:ts|js|py|rs|go|md|json|yaml|yml|toml|css|html|tsx|jsx))/g;
  const files = summaryText.match(filePattern) ?? [];
  for (const f of files) {
    upsertEntity(f, "file", projectPath);
    extracted.push(f);
  }

  // Extract function/class names (camelCase or PascalCase words > 3 chars)
  const codePattern = /\b([A-Z][a-zA-Z0-9]{3,})\b/g;
  const codeNames = summaryText.match(codePattern) ?? [];
  for (const name of new Set(codeNames)) {
    upsertEntity(name, "class", projectPath);
    extracted.push(name);
  }

  return extracted;
}

/**
 * Get all entities, optionally filtered by project.
 * @param projectPath - Optional project filter.
 * @returns Array of entities.
 */
export function getEntities(projectPath?: string): Entity[] {
  const database = getDb();
  let rows: Array<{ id: string; name: string; type: string; project: string; first_seen: string; last_seen: string }>;

  if (projectPath) {
    rows = database.prepare(`SELECT * FROM entities WHERE project = ? ORDER BY last_seen DESC`).all(projectPath) as typeof rows;
  } else {
    rows = database.prepare(`SELECT * FROM entities ORDER BY last_seen DESC`).all() as typeof rows;
  }

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    entityType: r.type as Entity["entityType"],
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
    mentionCount: 1,
  }));
}
