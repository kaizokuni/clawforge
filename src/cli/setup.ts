/**
 * CLI: clawforge setup
 * First-time global setup. Installs Playwright browsers, creates config,
 * and outputs the MCP server config snippet for .claude/settings.json.
 */

import { Command } from "commander";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ensureDirectories, loadConfig, writeConfig } from "../shared/config.js";
import { CLAWFORGE_HOME, VERSION } from "../shared/constants.js";
import { logger } from "../shared/logger.js";

export function makeSetupCommand(): Command {
  return new Command("setup")
    .description("First-time global setup for ClawForge")
    .option("--api-key <key>", "Anthropic API key (saved to config)")
    .option("--no-playwright", "Skip Playwright browser installation")
    .action(async (opts: { apiKey?: string; playwright?: boolean }) => {
      console.log(`ClawForge v${VERSION} — First-time setup\n`);

      try {
        // 1. Ensure all directories
        ensureDirectories();
        console.log("✓ Storage directories created");

        // 2. Save API key if provided
        if (opts.apiKey) {
          const config = loadConfig();
          config.llm.apiKey = opts.apiKey;
          writeConfig(config);
          console.log("✓ API key saved to config");
        }

        // 3. Install Playwright browsers
        if (opts.playwright !== false) {
          console.log("Installing Playwright browsers (Chromium)...");
          try {
            execSync("npx playwright install chromium --with-deps", { stdio: "inherit" });
            console.log("✓ Playwright Chromium installed");
          } catch {
            console.warn("⚠ Playwright install failed — browser tools will be unavailable");
          }
        }

        // 4. Print MCP config snippet
        const clawforgeExe = process.execPath;
        const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "index.js");

        console.log("\n── MCP Server Configuration ─────────────────────────");
        console.log("Add this to your .claude/settings.json:\n");
        console.log(JSON.stringify({
          mcpServers: {
            clawforge: {
              command: clawforgeExe,
              args: [scriptPath, "mcp"],
            },
          },
        }, null, 2));
        console.log("\nOr run: clawforge mcp  (directly as MCP stdio server)");

        logger.info("Setup completed", { version: VERSION });
        console.log("\n✓ Setup complete! Run 'clawforge start' to start the daemon.");
      } catch (e) {
        console.error(`Setup failed: ${String(e)}`);
        process.exit(1);
      }
    });
}
