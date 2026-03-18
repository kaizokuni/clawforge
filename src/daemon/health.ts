/**
 * Daemon health check.
 * Verifies daemon is running, returns status JSON.
 */

import { readDaemonPid, isProcessAlive } from "./process.js";
import { isBrowserActive } from "../tools/browser/controller.js";
import { VERSION } from "../shared/constants.js";
import type { HealthStatus } from "../shared/types.js";

/** Daemon start time (set when daemon starts). */
let daemonStartTime: number = Date.now();

/**
 * Set the daemon start time.
 */
export function setDaemonStartTime(): void {
  daemonStartTime = Date.now();
}

/**
 * Get the current health status of the daemon.
 * @returns HealthStatus object.
 */
export function getHealthStatus(): HealthStatus {
  const pid = readDaemonPid();
  const isRunning = pid !== null && isProcessAlive(pid);

  return {
    status: isRunning ? "healthy" : "unhealthy",
    uptime: Math.floor((Date.now() - daemonStartTime) / 1000),
    version: VERSION,
    tools: 35,
    memoryEnabled: true,
    browserActive: isBrowserActive(),
  };
}

/**
 * Check if daemon is healthy (quick boolean check).
 * @returns True if daemon is running.
 */
export function isDaemonHealthy(): boolean {
  const pid = readDaemonPid();
  return pid !== null && isProcessAlive(pid);
}
