/**
 * Session metrics tracker.
 * Records token usage, cost, and tool call counts per session.
 */

import crypto from "node:crypto";
import { getDb } from "../memory/vector-store.js";
import { logger } from "../../shared/logger.js";
import type { SessionMetrics, ToolResult } from "../../shared/types.js";

/** Model pricing per million tokens (USD). */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-20250514":    { input: 15.0,  output: 75.0 },
  "claude-sonnet-4-20250514":  { input: 3.0,   output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8,   output: 4.0  },
};

/**
 * Start tracking a new session.
 * @param projectPath - The project being worked on.
 * @returns The session ID.
 */
export function startSession(projectPath: string): string {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (id, start, project_path, tokens_in, tokens_out, cost)
    VALUES (?, ?, ?, 0, 0, 0)
  `).run(sessionId, now, projectPath);

  logger.info("Session started", { sessionId, projectPath });
  return sessionId;
}

/**
 * Record token usage for a session.
 * @param sessionId - Session to update.
 * @param tokensIn - Input tokens used.
 * @param tokensOut - Output tokens used.
 * @param model - Model used (for cost calculation).
 */
export function recordUsage(
  sessionId: string,
  tokensIn: number,
  tokensOut: number,
  model: string = "claude-sonnet-4-20250514"
): void {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING["claude-sonnet-4-20250514"]!;
  const cost = (tokensIn / 1_000_000) * pricing.input + (tokensOut / 1_000_000) * pricing.output;

  const db = getDb();
  db.prepare(`
    UPDATE sessions
    SET tokens_in = tokens_in + ?, tokens_out = tokens_out + ?, cost = cost + ?
    WHERE id = ?
  `).run(tokensIn, tokensOut, cost, sessionId);
}

/**
 * End a session.
 * @param sessionId - Session to close.
 */
export function endSession(sessionId: string): void {
  const db = getDb();
  db.prepare(`UPDATE sessions SET end_time = ? WHERE id = ?`).run(new Date().toISOString(), sessionId);
  logger.info("Session ended", { sessionId });
}

/**
 * Get metrics for a session.
 * @param sessionId - Session ID.
 * @returns Session metrics or null.
 */
export function getSessionMetrics(sessionId: string): SessionMetrics | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as {
    id: string; start: string; end_time?: string; tokens_in: number; tokens_out: number; cost: number;
  } | undefined;

  if (!row) return null;
  return {
    sessionId: row.id,
    startTime: row.start,
    endTime: row.end_time,
    toolCalls: 0,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    estimatedCost: row.cost,
  };
}

/**
 * Get recent sessions.
 * @param limit - Max sessions to return.
 * @returns Tool result with sessions array.
 */
export function getRecentSessions(limit: number = 20): ToolResult {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, start, end_time, project_path, tokens_in, tokens_out, cost
    FROM sessions ORDER BY start DESC LIMIT ?
  `).all(limit) as Array<{
    id: string; start: string; end_time?: string; project_path: string;
    tokens_in: number; tokens_out: number; cost: number;
  }>;

  return {
    success: true,
    data: { sessions: rows },
  };
}

/**
 * Get cost breakdown by project and time period.
 * @returns Tool result with cost data.
 */
export function getCostBreakdown(): ToolResult {
  const db = getDb();

  const byProject = db.prepare(`
    SELECT project_path, SUM(cost) as total_cost, SUM(tokens_in + tokens_out) as total_tokens
    FROM sessions GROUP BY project_path ORDER BY total_cost DESC
  `).all() as Array<{ project_path: string; total_cost: number; total_tokens: number }>;

  const daily = db.prepare(`
    SELECT date(start) as day, SUM(cost) as cost
    FROM sessions GROUP BY date(start) ORDER BY day DESC LIMIT 30
  `).all() as Array<{ day: string; cost: number }>;

  const total = db.prepare(`SELECT SUM(cost) as total FROM sessions`).get() as { total: number | null };

  return {
    success: true,
    data: {
      totalCost: total.total ?? 0,
      byProject,
      daily,
    },
  };
}
