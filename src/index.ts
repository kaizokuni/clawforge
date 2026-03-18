#!/usr/bin/env node

/**
 * ClawForge entry point.
 * Routes to MCP server mode or CLI mode based on arguments.
 */

import { VERSION, APP_NAME } from "./shared/constants.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "mcp") {
  // MCP stdio server mode — Claude Code connects here
  console.error(`[${APP_NAME}] Starting MCP server v${VERSION}...`);
  // TODO: Phase 5 — import and start MCP server
} else if (command === "--version" || command === "-v") {
  console.log(`${APP_NAME} v${VERSION}`);
} else if (command === "--help" || command === "-h" || !command) {
  console.log(`
${APP_NAME} v${VERSION} — Local MCP toolkit for Claude Code

Usage:
  clawforge mcp                Start MCP stdio server (for Claude Code)
  clawforge start              Start background daemon
  clawforge stop               Stop background daemon
  clawforge init               Initialize ClawForge in current project
  clawforge setup              First-time global setup

  clawforge browser <action>   Browser control (Playwright)
  clawforge memory <action>    Memory search and management
  clawforge search <query>     Web search
  clawforge design <action>    Design preview loop
  clawforge index <directory>  Index a codebase for semantic search
  clawforge cron <action>      Cron job management
  clawforge skill <action>     Skills management
  clawforge agent <action>     Sub-agent management
  clawforge mcp-hub <action>   MCP integration hub
  clawforge monitor            Monitoring dashboard
  clawforge command <action>   Slash command management
  clawforge hook <action>      Hook management
  clawforge settings <action>  Settings preset management
  clawforge marketplace <action> Component marketplace
  clawforge workflow <action>  Workflow management

Options:
  -v, --version    Show version
  -h, --help       Show this help message
`);
} else {
  // CLI command mode — will be wired in Phase 5
  console.error(`[${APP_NAME}] CLI command "${command}" not yet implemented.`);
  process.exit(1);
}
