/**
 * CLI: clawforge init
 * Initialize ClawForge in the current project directory.
 * Creates .clawforge/ config, CLAUDE.md template, and registers the project.
 */

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { ensureDirectories } from "../shared/config.js";
import { logger } from "../shared/logger.js";

export function makeInitCommand(): Command {
  return new Command("init")
    .description("Initialize ClawForge in the current project")
    .option("--force", "Overwrite existing configuration")
    .action((opts: { force?: boolean }) => {
      const cwd = process.cwd();

      try {
        // Ensure global dirs exist
        ensureDirectories();

        // Create local .clawforge marker
        const localDir = path.join(cwd, ".clawforge");
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        // Write a minimal project config
        const projectConfig = path.join(localDir, "project.yaml");
        if (!fs.existsSync(projectConfig) || opts.force) {
          fs.writeFileSync(projectConfig, `# ClawForge project config\npath: ${cwd}\n`, "utf-8");
        }

        // Suggest CLAUDE.md
        const claudeMd = path.join(cwd, "CLAUDE.md");
        if (!fs.existsSync(claudeMd)) {
          console.log("  Tip: Add a CLAUDE.md file to document your project for Claude Code.");
        }

        console.log(`✓ ClawForge initialized in: ${cwd}`);
        console.log("  Run 'clawforge start' to start the background daemon.");
        console.log("  Add to .claude/settings.json to enable MCP: clawforge setup");

        logger.info("Project initialized", { path: cwd });
      } catch (e) {
        console.error(`Init failed: ${String(e)}`);
        process.exit(1);
      }
    });
}
