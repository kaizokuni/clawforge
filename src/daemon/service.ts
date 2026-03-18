/**
 * Daemon background service.
 * Manages lifecycle: start/stop/status.
 * When running:
 *   - Cron scheduler
 *   - Browser pool warm
 *   - Memory observer
 *   - Monitor web server
 *   - Hook file watchers
 */

import { spawnDaemon, readDaemonPid, isProcessAlive, killDaemon } from "./process.js";
import { setDaemonStartTime, getHealthStatus } from "./health.js";
import { startWebServer } from "../tools/monitor/web-ui.js";
import { startAllJobs } from "../tools/cron/scheduler.js";
import { executeTask } from "../tools/cron/runner.js";
import { warmPool } from "../tools/browser/pool.js";
import { activateFileChangeHooks, fireSessionHook } from "../tools/hooks/watcher.js";
import { logger } from "../shared/logger.js";

/**
 * Start the daemon in the background.
 * @returns The PID of the started daemon.
 */
export function startDaemon(): number {
  const existing = readDaemonPid();
  if (existing && isProcessAlive(existing)) {
    logger.info("Daemon already running", { pid: existing });
    return existing;
  }

  const pid = spawnDaemon();
  logger.info("Daemon started", { pid });
  return pid;
}

/**
 * Stop the running daemon.
 */
export function stopDaemon(): void {
  const pid = readDaemonPid();
  if (!pid) {
    logger.info("No daemon running");
    return;
  }

  if (!isProcessAlive(pid)) {
    logger.info("Daemon PID found but process not alive, cleaning up");
    killDaemon(pid);
    return;
  }

  killDaemon(pid);
  logger.info("Daemon stopped", { pid });
}

/**
 * Get daemon status.
 * @returns Health status object.
 */
export function daemonStatus() {
  return getHealthStatus();
}

/**
 * Internal daemon main loop.
 * Called when process is launched with "daemon-internal" argument.
 * Starts all background services and keeps the process alive.
 */
export async function runDaemonInternal(): Promise<void> {
  setDaemonStartTime();
  logger.info("Daemon internal starting");

  // Start monitor web server
  try {
    await startWebServer();
    logger.info("Monitor web server started by daemon");
  } catch (err) {
    logger.warn("Monitor web server failed to start", { error: String(err) });
  }

  // Warm browser pool
  try {
    await warmPool();
    logger.info("Browser pool warmed");
  } catch (err) {
    logger.warn("Browser pool warm failed", { error: String(err) });
  }

  // Start cron scheduler
  try {
    startAllJobs(executeTask);
    logger.info("Cron scheduler started");
  } catch (err) {
    logger.warn("Cron scheduler failed to start", { error: String(err) });
  }

  // Activate file-change hooks
  try {
    activateFileChangeHooks();
    logger.info("File-change hooks activated");
  } catch (err) {
    logger.warn("Hook watchers failed", { error: String(err) });
  }

  // Fire session-start hooks
  fireSessionHook("on-session-start");

  // Keep process alive
  logger.info("Daemon running");

  process.on("SIGTERM", () => {
    fireSessionHook("on-session-end");
    logger.info("Daemon stopping via SIGTERM");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    fireSessionHook("on-session-end");
    logger.info("Daemon stopping via SIGINT");
    process.exit(0);
  });

  // Heartbeat every 60s
  setInterval(() => {
    logger.info("Daemon heartbeat", { uptime: Math.floor(process.uptime()) });
  }, 60_000).unref();
}
