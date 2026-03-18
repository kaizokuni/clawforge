/**
 * Cron task execution.
 * Run shell commands on schedule, log output.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LOG_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { CronTask } from "../../shared/types.js";

const CRON_LOG = path.join(LOG_DIR, "cron.log");

/**
 * Execute a cron task's command.
 * @param task - The cron task to run.
 * @returns The command output.
 */
export function executeTask(task: CronTask): string {
  const timestamp = new Date().toISOString();

  try {
    const output = execSync(task.command, {
      timeout: 60000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const logLine = `[${timestamp}] [OK] ${task.name}: ${output.trim().slice(0, 500)}\n`;
    appendCronLog(logLine);
    logger.info("Cron task executed", { id: task.id, name: task.name });
    return output;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const logLine = `[${timestamp}] [FAIL] ${task.name}: ${msg.slice(0, 500)}\n`;
    appendCronLog(logLine);
    logger.error("Cron task failed", { id: task.id, name: task.name, error: msg });
    return `Error: ${msg}`;
  }
}

/**
 * Append a line to the cron log file.
 * @param line - The log line.
 */
function appendCronLog(line: string): void {
  try {
    fs.mkdirSync(path.dirname(CRON_LOG), { recursive: true });
    fs.appendFileSync(CRON_LOG, line, "utf-8");
  } catch {
    // Silently ignore log write failures
  }
}
