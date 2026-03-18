/**
 * Monitor REST API.
 * Express routes for sessions, observations, cost, and live SSE stream.
 */

import type { Express, Request, Response } from "express";
import { getRecentSessions, getCostBreakdown } from "./tracker.js";
import { getDb } from "../memory/vector-store.js";
import { logger } from "../../shared/logger.js";

/** SSE clients waiting for live updates. */
const sseClients: Set<Response> = new Set();

/**
 * Broadcast a live event to all SSE subscribers.
 * @param event - Event type.
 * @param data - Event payload.
 */
export function broadcastLiveEvent(event: string, data: unknown): void {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(msg); } catch { sseClients.delete(client); }
  }
}

/**
 * Register all monitor API routes on an Express app.
 * @param app - Express application instance.
 */
export function registerApiRoutes(app: Express): void {
  // Recent sessions
  app.get("/api/sessions", (_req: Request, res: Response) => {
    const result = getRecentSessions(50);
    res.json(result.data);
  });

  // Session detail
  app.get("/api/sessions/:id", (req: Request, res: Response) => {
    const db = getDb();
    const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params["id"]);
    if (!session) { res.status(404).json({ error: "Not found" }); return; }
    res.json(session);
  });

  // Recent observations
  app.get("/api/observations", (req: Request, res: Response) => {
    const db = getDb();
    const search = req.query["q"] as string | undefined;
    const limit = Math.min(Number(req.query["limit"] ?? 50), 200);

    let rows: unknown[];
    if (search) {
      rows = db.prepare(`
        SELECT * FROM observations WHERE content LIKE ? OR title LIKE ?
        ORDER BY timestamp DESC LIMIT ?
      `).all(`%${search}%`, `%${search}%`, limit);
    } else {
      rows = db.prepare(`SELECT * FROM observations ORDER BY timestamp DESC LIMIT ?`).all(limit);
    }
    res.json({ observations: rows });
  });

  // Cost breakdown
  app.get("/api/cost", (_req: Request, res: Response) => {
    const result = getCostBreakdown();
    res.json(result.data);
  });

  // Live SSE stream
  app.get("/api/live", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    sseClients.add(res);
    res.write(`event: connected\ndata: {"status":"ok"}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  logger.info("Monitor API routes registered");
}
