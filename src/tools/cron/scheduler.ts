/**
 * Cron job scheduler.
 * Register, persist, and manage recurring tasks.
 */

import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";
import crypto from "node:crypto";
import { CRON_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { CronTask, ToolResult } from "../../shared/types.js";

const JOBS_FILE = path.join(CRON_DIR, "jobs.json");
const activeJobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Load persisted jobs from disk.
 * @returns Array of cron tasks.
 */
export function loadJobs(): CronTask[] {
  try {
    if (!fs.existsSync(JOBS_FILE)) return [];
    const raw = fs.readFileSync(JOBS_FILE, "utf-8");
    return JSON.parse(raw) as CronTask[];
  } catch {
    return [];
  }
}

/**
 * Save jobs to disk.
 * @param jobs - Array of cron tasks to persist.
 */
function saveJobs(jobs: CronTask[]): void {
  fs.mkdirSync(CRON_DIR, { recursive: true });
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

/**
 * Schedule a new cron job.
 * @param name - Job name.
 * @param schedule - Cron expression (5-field).
 * @param command - Shell command to run.
 * @returns Tool result with the created task.
 */
export function scheduleJob(name: string, schedule: string, command: string): ToolResult {
  if (!cron.validate(schedule)) {
    return { success: false, error: `Invalid cron expression: ${schedule}` };
  }

  const task: CronTask = {
    id: crypto.randomUUID(),
    name,
    schedule,
    command,
    enabled: true,
  };

  const jobs = loadJobs();
  jobs.push(task);
  saveJobs(jobs);

  logger.info("Cron job scheduled", { id: task.id, name, schedule });
  return { success: true, data: task };
}

/**
 * Remove a cron job by ID.
 * @param jobId - The job ID to remove.
 * @returns Tool result.
 */
export function removeJob(jobId: string): ToolResult {
  const jobs = loadJobs();
  const filtered = jobs.filter(j => j.id !== jobId);

  if (filtered.length === jobs.length) {
    return { success: false, error: `Job not found: ${jobId}` };
  }

  saveJobs(filtered);

  // Stop active instance
  const active = activeJobs.get(jobId);
  if (active) {
    active.stop();
    activeJobs.delete(jobId);
  }

  logger.info("Cron job removed", { id: jobId });
  return { success: true, data: { removed: jobId } };
}

/**
 * List all scheduled jobs.
 * @returns Tool result with jobs array.
 */
export function listJobs(): ToolResult {
  const jobs = loadJobs();
  return { success: true, data: { jobs } };
}

/**
 * Start all enabled cron jobs.
 * Called by the daemon on startup.
 * @param executor - Function to run when a job triggers.
 */
export function startAllJobs(executor: (task: CronTask) => void): void {
  const jobs = loadJobs();
  for (const job of jobs) {
    if (!job.enabled) continue;
    if (activeJobs.has(job.id)) continue;

    const task = cron.schedule(job.schedule, () => {
      logger.info("Cron job triggered", { id: job.id, name: job.name });
      executor(job);
    });

    activeJobs.set(job.id, task);
  }
  logger.info("Cron jobs started", { count: activeJobs.size });
}

/**
 * Stop all active cron jobs.
 */
export function stopAllJobs(): void {
  for (const [id, task] of activeJobs) {
    task.stop();
  }
  activeJobs.clear();
  logger.info("All cron jobs stopped");
}
