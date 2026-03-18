/**
 * ClawForge global constants.
 * Paths, port numbers, version, and other static values.
 */

import path from "node:path";
import os from "node:os";

/** Package version, kept in sync with package.json. */
export const VERSION = "0.1.0";

/** Application name used in logs and config. */
export const APP_NAME = "clawforge";

/** Root of user-level ClawForge data. */
export const CLAWFORGE_HOME = path.join(os.homedir(), ".clawforge");

/** Path to main config file. */
export const CONFIG_PATH = path.join(CLAWFORGE_HOME, "config.yaml");

/** SQLite database path. */
export const DB_PATH = path.join(CLAWFORGE_HOME, "data", "memory.db");

/** Logs directory. */
export const LOG_DIR = path.join(CLAWFORGE_HOME, "logs");

/** Sub-agent definitions directory (user-level). */
export const AGENTS_DIR = path.join(CLAWFORGE_HOME, "agents");

/** Installed skills directory (user-level). */
export const SKILLS_DIR = path.join(CLAWFORGE_HOME, "skills");

/** Slash command definitions directory (user-level). */
export const COMMANDS_DIR = path.join(CLAWFORGE_HOME, "commands");

/** Hook definitions directory (user-level). */
export const HOOKS_DIR = path.join(CLAWFORGE_HOME, "hooks");

/** Settings presets directory (user-level). */
export const SETTINGS_DIR = path.join(CLAWFORGE_HOME, "settings");

/** External MCP server configs directory. */
export const MCP_DIR = path.join(CLAWFORGE_HOME, "mcp");

/** Cron task definitions directory. */
export const CRON_DIR = path.join(CLAWFORGE_HOME, "cron");

/** Marketplace cached registry index directory. */
export const MARKETPLACE_DIR = path.join(CLAWFORGE_HOME, "marketplace");

/** Session cost/usage history directory. */
export const MONITOR_DIR = path.join(CLAWFORGE_HOME, "monitor");

/** Data directory (holds memory.db and other data files). */
export const DATA_DIR = path.join(CLAWFORGE_HOME, "data");

// ─── Ports ──────────────────────────────────────────────────────────────────

/** Default port for the monitoring dashboard web UI. */
export const MONITOR_PORT = 19877;

/** Default port for the MCP hub health endpoint (internal). */
export const MCP_HUB_PORT = 19878;

// ─── Limits ─────────────────────────────────────────────────────────────────

/** Maximum concurrent browser pages in the pool. */
export const MAX_BROWSER_PAGES = 5;

/** Default Playwright navigation timeout in milliseconds. */
export const BROWSER_TIMEOUT = 30_000;

/** Number of observations before triggering auto-compression. */
export const COMPRESS_BATCH_SIZE = 10;

/** Maximum tokens for a single memory search result set. */
export const MEMORY_SEARCH_MAX_TOKENS = 4000;

/** Default embedding vector dimensions (nomic-embed-text). */
export const EMBEDDING_DIMENSIONS = 768;

// ─── All user-level directories that must exist ─────────────────────────────

/** Directories that are created during init / first run. */
export const REQUIRED_DIRS = [
  CLAWFORGE_HOME,
  DATA_DIR,
  LOG_DIR,
  AGENTS_DIR,
  SKILLS_DIR,
  COMMANDS_DIR,
  HOOKS_DIR,
  SETTINGS_DIR,
  MCP_DIR,
  CRON_DIR,
  MARKETPLACE_DIR,
  MONITOR_DIR,
] as const;
