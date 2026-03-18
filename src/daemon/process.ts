/**
 * Daemon process management.
 * Platform-specific daemonization using child_process.spawn + detached + unref().
 * Writes a PID file to ~/.clawforge/daemon.pid.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CLAWFORGE_HOME } from "../shared/constants.js";

const PID_FILE = path.join(CLAWFORGE_HOME, "daemon.pid");

/**
 * Launch the daemon as a detached background process.
 * @returns The PID of the spawned daemon process.
 */
export function spawnDaemon(): number {
  // Get the current executable
  const nodeExec = process.execPath;
  const scriptPath = new URL(import.meta.url).pathname.replace(/daemon\/process\.js$/, "index.js");

  const child = spawn(nodeExec, [scriptPath, "daemon-internal"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env },
  });

  const pid = child.pid!;
  child.unref();

  fs.mkdirSync(CLAWFORGE_HOME, { recursive: true });
  fs.writeFileSync(PID_FILE, String(pid), "utf-8");

  return pid;
}

/**
 * Read the daemon PID from the PID file.
 * @returns PID or null if not running.
 */
export function readDaemonPid(): number | null {
  try {
    if (!fs.existsSync(PID_FILE)) return null;
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Check if a process with the given PID is alive.
 * @param pid - Process ID to check.
 * @returns True if the process is running.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill the daemon process by PID.
 * @param pid - Process ID to kill.
 */
export function killDaemon(pid: number): void {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Already gone
  }
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    // File already removed
  }
}

/**
 * Clear the PID file.
 */
export function clearPidFile(): void {
  try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
}
