/**
 * Monitor terminal UI.
 * Prints a formatted dashboard to stdout by querying the REST API.
 * Full Ink-based TUI wired in Phase 5 CLI.
 */

import { getRecentSessions, getCostBreakdown } from "./tracker.js";
import { getDb } from "../memory/vector-store.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Print the monitor dashboard to stdout.
 * @returns Tool result with status data.
 */
export function printDashboard(): ToolResult {
  try {
    const sessions = getRecentSessions(10);
    const cost = getCostBreakdown();
    const db = getDb();

    const obsCount = (db.prepare(`SELECT COUNT(*) as c FROM observations`).get() as { c: number }).c;
    const costData = cost.data as {
      totalCost: number;
      byProject: Array<{ project_path: string; total_cost: number }>;
    };
    const sessionData = sessions.data as { sessions: Array<{
      id: string; start: string; project_path: string; tokens_in: number; tokens_out: number; cost: number;
    }> };

    const lines = [
      "╔══════════════════════════════════════╗",
      "║      🦀 ClawForge Monitor            ║",
      "╚══════════════════════════════════════╝",
      "",
      `  Total Cost:     $${costData.totalCost.toFixed(4)}`,
      `  Sessions:       ${sessionData.sessions.length}`,
      `  Observations:   ${obsCount}`,
      "",
      "  ── Recent Sessions ──────────────────",
    ];

    for (const s of sessionData.sessions.slice(0, 5)) {
      const time = new Date(s.start).toLocaleString();
      const project = s.project_path.split("/").pop() ?? s.project_path;
      lines.push(`  ${time}  ${project}  $${s.cost.toFixed(4)}`);
    }

    lines.push("");
    lines.push("  ── Cost by Project ──────────────────");
    for (const p of (costData.byProject ?? []).slice(0, 5)) {
      lines.push(`  ${p.project_path.split("/").pop()}  $${p.total_cost.toFixed(4)}`);
    }

    console.log(lines.join("\n"));

    return {
      success: true,
      data: {
        totalCost: costData.totalCost,
        sessionCount: sessionData.sessions.length,
        observationCount: obsCount,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Dashboard print failed", { error: msg });
    return { success: false, error: msg };
  }
}
