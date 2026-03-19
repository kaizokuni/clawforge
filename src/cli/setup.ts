/**
 * CLI: clawforge setup
 * First-time global setup. Creates dirs, installs Playwright, copies built-in
 * components to ~/.clawforge/, seeds marketplace registry, prints MCP config.
 */

import { Command } from "commander";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDirectories, loadConfig, writeConfig } from "../shared/config.js";
import {
  CLAWFORGE_HOME, AGENTS_DIR, SKILLS_DIR, COMMANDS_DIR,
  HOOKS_DIR, SETTINGS_DIR, VERSION,
} from "../shared/constants.js";
import { getDb } from "../tools/memory/vector-store.js";
import { publishComponent } from "../tools/marketplace/publisher.js";
import { logger } from "../shared/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root = two levels up from src/cli/ */
const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Copy all .md or SKILL.md files from a source dir to a dest dir. */
function copyComponents(srcDir: string, destDir: string): number {
  if (!fs.existsSync(srcDir)) return 0;
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skill sub-directories (contain SKILL.md)
      const skillMd = path.join(srcDir, entry.name, "SKILL.md");
      if (fs.existsSync(skillMd)) {
        const destSkillDir = path.join(destDir, entry.name);
        fs.mkdirSync(destSkillDir, { recursive: true });
        fs.copyFileSync(skillMd, path.join(destSkillDir, "SKILL.md"));
        count++;
      }
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
      const dest = path.join(destDir, entry.name);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(srcDir, entry.name), dest);
        count++;
      }
    }
  }
  return count;
}

export function makeSetupCommand(): Command {
  return new Command("setup")
    .description("First-time global setup for ClawForge")
    .option("--api-key <key>", "Anthropic API key (saved to config)")
    .option("--no-playwright", "Skip Playwright browser installation")
    .action(async (opts: { apiKey?: string; playwright?: boolean }) => {
      console.log(`ClawForge v${VERSION} — First-time setup\n`);

      try {
        // 1. Create all storage directories
        ensureDirectories();
        console.log("✓ Storage directories created");

        // 2. Initialize SQLite database schema (lazy-init via getDb())
        getDb();
        console.log("✓ Database initialized");

        // 3. Save API key if provided
        if (opts.apiKey) {
          const config = loadConfig();
          config.llm.apiKey = opts.apiKey;
          writeConfig(config);
          console.log("✓ API key saved to config");
        }

        // 4. Copy built-in components to ~/.clawforge/
        const componentDirs: Array<[string, string]> = [
          [path.join(REPO_ROOT, "agents"),   AGENTS_DIR],
          [path.join(REPO_ROOT, "skills"),   SKILLS_DIR],
          [path.join(REPO_ROOT, "commands"), COMMANDS_DIR],
          [path.join(REPO_ROOT, "hooks"),    HOOKS_DIR],
          [path.join(REPO_ROOT, "settings"), SETTINGS_DIR],
        ];

        let totalCopied = 0;
        for (const [src, dest] of componentDirs) {
          const n = copyComponents(src, dest);
          totalCopied += n;
        }
        console.log(`✓ Built-in components installed (${totalCopied} files)`);

        // 5. Seed marketplace registry with built-in components
        let seeded = 0;
        for (const [src] of componentDirs) {
          if (!fs.existsSync(src)) continue;
          for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            let filePath = "";
            if (entry.isDirectory()) {
              filePath = path.join(src, entry.name, "SKILL.md");
            } else if (entry.name.endsWith(".md") || entry.name.endsWith(".yaml")) {
              filePath = path.join(src, entry.name);
            }
            if (filePath && fs.existsSync(filePath)) {
              const result = publishComponent(filePath, "clawforge");
              if (result.success) seeded++;
            }
          }
        }
        console.log(`✓ Marketplace registry seeded (${seeded} components)`);

        // 6. Install Playwright browsers
        if (opts.playwright !== false) {
          console.log("Installing Playwright browsers (Chromium)...");
          try {
            execSync("npx playwright install chromium --with-deps", { stdio: "inherit" });
            console.log("✓ Playwright Chromium installed");
          } catch {
            console.warn("⚠ Playwright install failed — browser tools will be unavailable");
          }
        }

        // 7. Try pulling Ollama embedding model
        console.log("Pulling Ollama embedding model (nomic-embed-text)...");
        try {
          execSync("ollama pull nomic-embed-text", { stdio: "inherit", timeout: 60_000 });
          console.log("✓ Ollama nomic-embed-text ready");
        } catch {
          console.warn("⚠ Ollama not available — embeddings will fall back to OpenAI or zero vector");
        }

        // 8. Print MCP config snippet
        const nodeExe = process.execPath;
        const scriptPath = path.join(REPO_ROOT, "dist", "index.js");

        console.log("\n── MCP Server Configuration ─────────────────────────────");
        console.log("Add this to ~/.claude/settings.json (or project .claude/settings.json):\n");
        console.log(JSON.stringify({
          mcpServers: {
            clawforge: {
              command: nodeExe,
              args: [scriptPath, "mcp"],
            },
          },
        }, null, 2));
        console.log("\nOr run `clawforge init` in any project to auto-configure it.\n");

        logger.info("Setup completed", { version: VERSION, componentsInstalled: totalCopied });
        console.log("✓ Setup complete! Run 'clawforge init' in your project, then restart Claude Code.");
      } catch (e) {
        console.error(`Setup failed: ${String(e)}`);
        process.exit(1);
      }
    });
}
