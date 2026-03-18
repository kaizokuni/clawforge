#!/usr/bin/env node

/**
 * ClawForge entry point.
 * Routes to MCP server mode, daemon internal mode, or CLI mode.
 */

const args = process.argv.slice(2);
const command = args[0];

if (command === "mcp") {
  // MCP stdio server mode — Claude Code connects here
  const { startMcpServer } = await import("./mcp/server.js");
  await startMcpServer();

} else if (command === "daemon-internal") {
  // Background daemon internal process
  const { runDaemonInternal } = await import("./daemon/service.js");
  await runDaemonInternal();

} else {
  // CLI mode — Commander.js handles all other commands
  const { buildCli } = await import("./cli/index.js");
  const program = buildCli();
  program.parse(process.argv);
}
