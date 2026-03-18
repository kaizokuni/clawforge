/**
 * SQLite + sqlite-vec vector store.
 * Creates/opens ~/.clawforge/data/memory.db with all required tables.
 */

import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import fs from "node:fs";
import path from "node:path";
import { DB_PATH, DATA_DIR, EMBEDDING_DIMENSIONS } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { Observation, Summary, MemorySearchResult, MemoryTimelineEntry } from "../../shared/types.js";
import crypto from "node:crypto";

let db: Database.Database | null = null;

/**
 * Get or create the singleton database connection.
 * @returns The SQLite database instance.
 */
export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  sqliteVec.load(db);

  createTables(db);
  logger.info("Vector store initialized", { path: DB_PATH });
  return db;
}

/**
 * Create all required tables if they don't exist.
 * @param database - The SQLite database instance.
 */
function createTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      observation_ids TEXT NOT NULL,
      compressed_text TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      project TEXT NOT NULL,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      start TEXT NOT NULL,
      end_time TEXT,
      project_path TEXT NOT NULL,
      tokens_in INTEGER DEFAULT 0,
      tokens_out INTEGER DEFAULT 0,
      cost REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS diary (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(session_id);
    CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project_path);
    CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(timestamp);
    CREATE INDEX IF NOT EXISTS idx_summaries_created ON summaries(created_at);
    CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
  `);

  // Create virtual tables for vector search
  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS summary_embeddings USING vec0(
      id TEXT PRIMARY KEY,
      vector float[${EMBEDDING_DIMENSIONS}]
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS project_index USING vec0(
      id TEXT PRIMARY KEY,
      vector float[${EMBEDDING_DIMENSIONS}]
    );
  `);

  // Metadata table for project_index chunks
  database.exec(`
    CREATE TABLE IF NOT EXISTS project_index_meta (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      chunk_text TEXT NOT NULL,
      project_path TEXT NOT NULL
    );
  `);
}

/**
 * Insert an observation into the database.
 * @param obs - The observation to insert.
 */
export function insertObservation(obs: Observation): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO observations (id, timestamp, type, title, content, session_id, project_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(obs.id, obs.timestamp, obs.tags[0] ?? "unknown", obs.toolName, obs.output, obs.sessionId, obs.projectPath);
}

/**
 * Insert a summary into the database.
 * @param summary - The summary to insert.
 */
export function insertSummary(summary: Summary): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO summaries (id, observation_ids, compressed_text, category, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    summary.id,
    JSON.stringify(summary.observationIds),
    summary.content,
    "general",
    summary.timestamp
  );
}

/**
 * Insert an embedding vector linked to a summary.
 * @param summaryId - The summary this embedding belongs to.
 * @param vector - The float array embedding.
 */
export function insertEmbedding(summaryId: string, vector: number[]): void {
  const database = getDb();
  const id = crypto.randomUUID();
  const buf = Buffer.from(new Float32Array(vector).buffer);
  const stmt = database.prepare(`
    INSERT INTO summary_embeddings (id, vector) VALUES (?, ?)
  `);
  stmt.run(id, buf);

  // Link embedding to summary via id convention
  database.prepare(`
    INSERT OR REPLACE INTO summaries (id, observation_ids, compressed_text, category, created_at)
    VALUES (?, COALESCE((SELECT observation_ids FROM summaries WHERE id = ?), '[]'),
            COALESCE((SELECT compressed_text FROM summaries WHERE id = ?), ''),
            COALESCE((SELECT category FROM summaries WHERE id = ?), 'general'),
            COALESCE((SELECT created_at FROM summaries WHERE id = ?), ?))
  `).run(summaryId, summaryId, summaryId, summaryId, summaryId, new Date().toISOString());

  // Store the embedding id referencing the summary
  database.exec(`
    CREATE TABLE IF NOT EXISTS embedding_summary_map (
      embedding_id TEXT PRIMARY KEY,
      summary_id TEXT NOT NULL
    )
  `);
  database.prepare(`INSERT OR REPLACE INTO embedding_summary_map (embedding_id, summary_id) VALUES (?, ?)`).run(id, summaryId);
}

/**
 * Search for similar vectors using cosine similarity.
 * @param queryVector - The query embedding vector.
 * @param limit - Maximum number of results.
 * @returns Array of memory search results sorted by relevance.
 */
export function cosineSimilaritySearch(queryVector: number[], limit: number = 10): MemorySearchResult[] {
  const database = getDb();
  const buf = Buffer.from(new Float32Array(queryVector).buffer);

  // Ensure mapping table exists
  database.exec(`
    CREATE TABLE IF NOT EXISTS embedding_summary_map (
      embedding_id TEXT PRIMARY KEY,
      summary_id TEXT NOT NULL
    )
  `);

  const rows = database.prepare(`
    SELECT se.id, se.distance, esm.summary_id
    FROM summary_embeddings se
    JOIN embedding_summary_map esm ON esm.embedding_id = se.id
    WHERE se.vector MATCH ?
    ORDER BY se.distance
    LIMIT ?
  `).all(buf, limit) as Array<{ id: string; distance: number; summary_id: string }>;

  const results: MemorySearchResult[] = [];
  for (const row of rows) {
    const summary = database.prepare(`SELECT * FROM summaries WHERE id = ?`).get(row.summary_id) as {
      id: string;
      compressed_text: string;
      created_at: string;
    } | undefined;

    if (summary) {
      results.push({
        id: summary.id,
        content: summary.compressed_text,
        score: 1 - row.distance,
        sourceType: "summary",
        timestamp: summary.created_at,
        projectPath: "",
      });
    }
  }
  return results;
}

/**
 * Get observations by their IDs.
 * @param ids - Array of observation IDs.
 * @returns Array of observation rows.
 */
export function getObservationsByIds(ids: string[]): Array<{
  id: string;
  timestamp: string;
  type: string;
  title: string;
  content: string;
  session_id: string;
  project_path: string;
}> {
  if (ids.length === 0) return [];
  const database = getDb();
  const placeholders = ids.map(() => "?").join(",");
  return database.prepare(`SELECT * FROM observations WHERE id IN (${placeholders})`).all(...ids) as Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    content: string;
    session_id: string;
    project_path: string;
  }>;
}

/**
 * Get a timeline of observations around a given observation.
 * @param observationId - The center observation ID.
 * @param windowSize - Number of observations before/after to include.
 * @returns Array of timeline entries.
 */
export function getTimeline(observationId: string, windowSize: number = 5): MemoryTimelineEntry[] {
  const database = getDb();

  const center = database.prepare(`SELECT timestamp, project_path FROM observations WHERE id = ?`).get(observationId) as {
    timestamp: string;
    project_path: string;
  } | undefined;

  if (!center) return [];

  const rows = database.prepare(`
    SELECT timestamp, title as summary, project_path
    FROM observations
    WHERE project_path = ? AND timestamp >= datetime(?, '-${windowSize} hours') AND timestamp <= datetime(?, '+${windowSize} hours')
    ORDER BY timestamp
  `).all(center.project_path, center.timestamp, center.timestamp) as Array<{
    timestamp: string;
    summary: string;
    project_path: string;
  }>;

  return rows.map(r => ({
    timestamp: r.timestamp,
    summary: r.summary,
    observationCount: 1,
    projectPath: r.project_path,
  }));
}

/**
 * Insert a project index chunk with its embedding.
 * @param id - Unique chunk ID.
 * @param filePath - Source file path.
 * @param chunkText - The text chunk.
 * @param projectPath - The project root path.
 * @param vector - The embedding vector.
 */
export function insertProjectChunk(id: string, filePath: string, chunkText: string, projectPath: string, vector: number[]): void {
  const database = getDb();
  const buf = Buffer.from(new Float32Array(vector).buffer);
  database.prepare(`INSERT OR REPLACE INTO project_index (id, vector) VALUES (?, ?)`).run(id, buf);
  database.prepare(`INSERT OR REPLACE INTO project_index_meta (id, file_path, chunk_text, project_path) VALUES (?, ?, ?, ?)`).run(id, filePath, chunkText, projectPath);
}

/**
 * Search project index for similar chunks.
 * @param queryVector - The query embedding.
 * @param limit - Max results.
 * @returns Matching chunks with file paths and scores.
 */
export function searchProjectIndex(queryVector: number[], limit: number = 10): Array<{
  filePath: string;
  chunkText: string;
  score: number;
  projectPath: string;
}> {
  const database = getDb();
  const buf = Buffer.from(new Float32Array(queryVector).buffer);

  const rows = database.prepare(`
    SELECT pi.id, pi.distance
    FROM project_index pi
    WHERE pi.vector MATCH ?
    ORDER BY pi.distance
    LIMIT ?
  `).all(buf, limit) as Array<{ id: string; distance: number }>;

  return rows.map(row => {
    const meta = database.prepare(`SELECT * FROM project_index_meta WHERE id = ?`).get(row.id) as {
      file_path: string;
      chunk_text: string;
      project_path: string;
    } | undefined;
    return {
      filePath: meta?.file_path ?? "",
      chunkText: meta?.chunk_text ?? "",
      score: 1 - row.distance,
      projectPath: meta?.project_path ?? "",
    };
  });
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
