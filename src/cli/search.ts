/**
 * CLI: clawforge search <query>
 * Web search and page fetching.
 */

import { Command } from "commander";
import { searchDuckDuckGo } from "../tools/search/engine.js";
import { fetchPage } from "../tools/search/fetcher.js";

export function makeSearchCommand(): Command {
  const cmd = new Command("search").description("Web search and page fetching");

  cmd.command("web <query>")
    .description("Search the web using DuckDuckGo")
    .option("--limit <n>", "Max results", "10")
    .action(async (query: string, opts: { limit: string }) => {
      try {
        const results = await searchDuckDuckGo(query, parseInt(opts.limit, 10));
        console.log(JSON.stringify(results, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("fetch <url>")
    .description("Fetch and extract readable text from a web page")
    .option("--max-length <n>", "Max characters", "50000")
    .action(async (url: string, opts: { maxLength: string }) => {
      try {
        const text = await fetchPage(url, parseInt(opts.maxLength, 10));
        console.log(text);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  // Default action: search directly
  cmd.argument("[query...]")
    .action(async (queryParts: string[]) => {
      if (queryParts.length === 0) { cmd.help(); return; }
      const query = queryParts.join(" ");
      try {
        const results = await searchDuckDuckGo(query, 10);
        console.log(JSON.stringify(results, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
