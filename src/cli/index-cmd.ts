/**
 * CLI: clawforge index <directory>
 * Project indexer commands.
 */

import { Command } from "commander";
import { indexProject, searchIndex } from "../tools/indexer/search.js";

export function makeIndexCommand(): Command {
  const cmd = new Command("index").description("Semantic code index management");

  cmd.command("build <directory>")
    .description("Scan and index a codebase for semantic search")
    .option("--force", "Force re-index even if already indexed")
    .action(async (directory: string, opts: { force?: boolean }) => {
      try {
        console.log(`Indexing ${directory}...`);
        const result = await indexProject(directory);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("search <query>")
    .description("Search the project index semantically")
    .option("--limit <n>", "Max results", "10")
    .option("--project <path>", "Filter to a specific project")
    .action(async (query: string, opts: { limit: string; project?: string }) => {
      try {
        const results = await searchIndex(query, parseInt(opts.limit, 10));
        console.log(JSON.stringify(results, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  // Default: index the given directory
  cmd.argument("[directory]")
    .action(async (directory: string | undefined) => {
      if (!directory) { cmd.help(); return; }
      try {
        console.log(`Indexing ${directory}...`);
        const result = await indexProject(directory);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
