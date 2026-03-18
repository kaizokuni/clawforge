/**
 * CLI: clawforge memory <action>
 * Memory search and management commands.
 */

import { Command } from "commander";
import { search, getFullObservations } from "../tools/memory/retriever.js";
import { captureObservation } from "../tools/memory/observer.js";
import type { ObservationType } from "../tools/memory/observer.js";
import { getRecentContext, formatContextForInjection } from "../tools/memory/injector.js";

export function makeMemoryCommand(): Command {
  const cmd = new Command("memory").description("Persistent vector memory management");

  cmd.command("search <query>")
    .description("Search memory for relevant observations")
    .option("--limit <n>", "Max results", "10")
    .option("--project <path>", "Filter by project path")
    .action(async (query: string, opts: { limit: string; project?: string }) => {
      try {
        const results = await search(query, parseInt(opts.limit, 10));
        console.log(JSON.stringify(results, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("store <title>")
    .description("Manually store an observation in memory")
    .requiredOption("--content <text>", "Observation content")
    .option("--type <type>", "Observation type", "decision")
    .action(async (title: string, opts: { content: string; type: string }) => {
      try {
        const validTypes: ObservationType[] = ["file_read","file_write","shell_command","git_op","decision","bug_fix","feature","discovery"];
        const obsType = validTypes.includes(opts.type as ObservationType) ? opts.type as ObservationType : "decision";
        captureObservation(obsType, title, opts.content, crypto.randomUUID(), process.cwd());
        console.log(`Stored: ${title}`);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("context")
    .description("Show recent memory context for the current project")
    .option("--limit <n>", "Max entries", "10")
    .action((opts: { limit: string }) => {
      try {
        const entries = getRecentContext(parseInt(opts.limit, 10), process.cwd());
        console.log(formatContextForInjection(entries));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("get <ids...>")
    .description("Get full observation details by IDs")
    .action((ids: string[]) => {
      try {
        const obs = getFullObservations(ids);
        console.log(JSON.stringify(obs, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
