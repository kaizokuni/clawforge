/**
 * CLI: clawforge cron <action>
 * Cron job management commands.
 */

import { Command } from "commander";
import { scheduleJob, removeJob, listJobs } from "../tools/cron/scheduler.js";

export function makeCronCommand(): Command {
  const cmd = new Command("cron").description("Scheduled task management");

  cmd.command("add <name> <schedule> <command>")
    .description("Schedule a new cron task (e.g. '0 9 * * *' for daily at 9am)")
    .action((name: string, schedule: string, command: string) => {
      try {
        const result = scheduleJob(name, schedule, command);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all scheduled tasks")
    .action(() => {
      try {
        const jobs = listJobs();
        console.log(JSON.stringify(jobs, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("remove <id>")
    .description("Remove a scheduled task by ID")
    .action((id: string) => {
      try {
        const result = removeJob(id);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
