/**
 * Monitor REST API.
 * Express routes for sessions, observations, cost, and live SSE stream.
 */

import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
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

  // Cross-process broadcast endpoint — MCP server POSTs here to push SSE events
  app.post("/api/broadcast", (req: Request, res: Response) => {
    const { event, data } = req.body as { event: string; data: unknown };
    if (event && data !== undefined) {
      broadcastLiveEvent(event, data);
    }
    res.json({ ok: true });
  });

  // Aggregate stats summary
  app.get("/api/stats", (_req: Request, res: Response) => {
    const db = getDb();
    const sessions = db.prepare(`SELECT COUNT(*) as n, COALESCE(SUM(tokens_in),0) as ti, COALESCE(SUM(tokens_out),0) as to_, COALESCE(SUM(tool_calls),0) as tc, COALESCE(SUM(cost),0) as cost FROM sessions`).get() as { n: number; ti: number; to_: number; tc: number; cost: number };
    const obs = db.prepare(`SELECT COUNT(*) as n FROM observations`).get() as { n: number };
    res.json({ sessions: sessions.n, tokensIn: sessions.ti, tokensOut: sessions.to_, toolCalls: sessions.tc, totalCost: sessions.cost, observations: obs.n });
  });

  // Streaming chat endpoint — requires ANTHROPIC_API_KEY in environment
  app.post("/api/chat", async (req: Request, res: Response) => {
    const { message, history = [] } = req.body as {
      message: string;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }
    if (!process.env["ANTHROPIC_API_KEY"]) {
      res.status(503).json({ error: "ANTHROPIC_API_KEY not set — add it to your environment to enable chat." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const client = new Anthropic();
      const stream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: "You are an AI assistant embedded in the ClawForge monitor dashboard. ClawForge is an MCP toolkit that extends Claude Code with browser control, persistent vector memory, web search, sub-agents, and more. You help users understand their session data, memory observations, costs, and tool usage. Be concise and direct.",
        messages: [...history, { role: "user", content: message }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    } finally {
      res.end();
    }
  });

  logger.info("Monitor API routes registered");
}
