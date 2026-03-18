/**
 * CLI: clawforge monitor
 * Monitoring dashboard commands.
 */

import { Command } from "commander";
import { printDashboard } from "../tools/monitor/tui.js";
import { startWebServer } from "../tools/monitor/web-ui.js";
import { getCostBreakdown, getRecentSessions } from "../tools/monitor/tracker.js";
import { MONITOR_PORT } from "../shared/constants.js";

export function makeMonitorCommand(): Command {
  const cmd = new Command("monitor").description("Monitoring dashboard");

  cmd.command("status")
    .description("Print TUI dashboard to stdout")
    .action(() => {
      try {
        printDashboard();
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("web")
    .description(`Start the web dashboard at http://localhost:${MONITOR_PORT}`)
    .option("--port <n>", "Port to listen on", String(MONITOR_PORT))
    .action(async (opts: { port: string }) => {
      try {
        await startWebServer(parseInt(opts.port, 10));
        console.log(`Monitor dashboard running at http://localhost:${opts.port}`);
        console.log("Press Ctrl+C to stop.");
        // Keep alive
        await new Promise(() => {});
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("cost")
    .description("Show cost breakdown by project")
    .action(() => {
      try {
        const result = getCostBreakdown();
        console.log(JSON.stringify(result.data, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("sessions")
    .description("Show recent sessions")
    .option("--limit <n>", "Max sessions", "20")
    .action((opts: { limit: string }) => {
      try {
        const result = getRecentSessions(parseInt(opts.limit, 10));
        console.log(JSON.stringify(result.data, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  // Default action: print dashboard
  cmd.action(() => {
    try {
      printDashboard();
    } catch (e) { console.error(String(e)); process.exit(1); }
  });

  return cmd;
}
