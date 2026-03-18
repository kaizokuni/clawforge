/**
 * CLI: clawforge marketplace <action>
 * Component marketplace commands.
 */

import { Command } from "commander";
import { searchMarketplace } from "../tools/marketplace/searcher.js";
import { installFromPath, installFromUrl } from "../tools/marketplace/installer.js";
import { installStack, listStacks } from "../tools/marketplace/stacks.js";
import { browseMarketplace } from "../tools/marketplace/browser.js";
import { publishComponent } from "../tools/marketplace/publisher.js";
import type { ComponentType } from "../shared/types.js";

export function makeMarketplaceCommand(): Command {
  const cmd = new Command("marketplace").description("Component marketplace");

  cmd.command("browse")
    .description("Browse available components")
    .option("--query <text>", "Search query")
    .option("--type <type>", "Filter by type (agent|skill|command|hook|setting|...)")
    .action((opts: { query?: string; type?: string }) => {
      try {
        const result = browseMarketplace(opts.query, opts.type as ComponentType | undefined);
        if (result.success) {
          console.log((result.data as { formatted: string }).formatted);
        } else {
          console.error(result.error);
          process.exit(1);
        }
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("search <query>")
    .description("Search for components")
    .option("--type <type>", "Filter by type")
    .option("--limit <n>", "Max results", "20")
    .action((query: string, opts: { type?: string; limit: string }) => {
      try {
        const result = searchMarketplace({
          query,
          type: opts.type as ComponentType | undefined,
          limit: parseInt(opts.limit, 10),
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("install <source>")
    .description("Install a component from a path or URL")
    .action(async (source: string) => {
      try {
        const result = source.startsWith("http")
          ? await installFromUrl(source)
          : installFromPath(source);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("stack <name>")
    .description("Install a full component stack")
    .action((name: string) => {
      try {
        const result = installStack(name);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("stacks")
    .description("List available stacks")
    .action(() => {
      try {
        const result = listStacks();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("publish <file>")
    .description("Publish a local component to the registry")
    .option("--author <name>", "Author name", "anonymous")
    .action((file: string, opts: { author: string }) => {
      try {
        const result = publishComponent(file, opts.author);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
