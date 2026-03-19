/**
 * CLI: clawforge init
 * Initialize ClawForge in the current project.
 * Generates CLAUDE.md from template and configures MCP in ~/.claude/settings.json.
 */

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import { ensureDirectories } from "../shared/config.js";
import { logger } from "../shared/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TEMPLATE_PATH = path.join(REPO_ROOT, "templates", "CLAUDE.md.hbs");

export function makeInitCommand(): Command {
  return new Command("init")
    .description("Initialize ClawForge in the current project")
    .option("--force", "Overwrite existing CLAUDE.md")
    .option("--name <name>", "Project name (defaults to directory name)")
    .option("--description <text>", "Project description")
    .action((opts: { force?: boolean; name?: string; description?: string }) => {
      const cwd = process.cwd();

      try {
        ensureDirectories();

        // 1. Generate CLAUDE.md from Handlebars template
        const claudeMdPath = path.join(cwd, "CLAUDE.md");
        if (!fs.existsSync(claudeMdPath) || opts.force) {
          let templateSource = "";
          if (fs.existsSync(TEMPLATE_PATH)) {
            templateSource = fs.readFileSync(TEMPLATE_PATH, "utf-8");
          } else {
            // Fallback minimal template
            templateSource = `# {{projectName}}\n\nClawForge is active. Run \`clawforge skill list\` to see available tools.\n`;
          }

          const template = Handlebars.compile(templateSource);
          const projectName = opts.name ?? path.basename(cwd);
          const rendered = template({
            projectName,
            projectDescription: opts.description ?? "",
            stack: "",
            conventions: "",
            notes: "",
          });

          fs.writeFileSync(claudeMdPath, rendered, "utf-8");
          console.log(`✓ CLAUDE.md generated at ${claudeMdPath}`);
        } else {
          console.log("  CLAUDE.md already exists — skipping (use --force to overwrite)");
        }

        // 2. Configure MCP in Claude Code settings
        const claudeSettingsDir = path.join(os.homedir(), ".claude");
        const settingsPath = path.join(claudeSettingsDir, "settings.json");

        fs.mkdirSync(claudeSettingsDir, { recursive: true });

        let settings: Record<string, unknown> = {};
        if (fs.existsSync(settingsPath)) {
          try {
            settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as Record<string, unknown>;
          } catch {
            // Malformed JSON — start fresh
            console.warn("  Warning: existing settings.json is malformed, it will be merged carefully.");
          }
        }

        // Merge MCP server config without overwriting other servers
        const mcpServers = (settings["mcpServers"] as Record<string, unknown>) ?? {};
        const nodeExe = process.execPath;
        const scriptPath = path.join(REPO_ROOT, "dist", "index.js");

        mcpServers["clawforge"] = {
          command: nodeExe,
          args: [scriptPath, "mcp"],
        };
        settings["mcpServers"] = mcpServers;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
        console.log(`✓ MCP server configured in ${settingsPath}`);

        // 3. Print next steps
        console.log("\n✓ ClawForge initialized!");
        console.log("\nNext steps:");
        console.log("  1. Restart Claude Code (Cmd/Ctrl+Shift+P → 'Reload Window')");
        console.log("  2. ClawForge tools will appear automatically in Claude Code");
        console.log("  3. Try: 'use skill_list to see available skills'");
        console.log(`\nMonitor dashboard: clawforge monitor web  → http://localhost:19877`);

        logger.info("Project initialized", { path: cwd });
      } catch (e) {
        console.error(`Init failed: ${String(e)}`);
        process.exit(1);
      }
    });
}
