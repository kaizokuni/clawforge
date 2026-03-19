/**
 * ClawForge MCP stdio server.
 * Creates an McpServer, registers all 35 tools, connects via stdio transport.
 * This is what Claude Code connects to.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools.js";
import { logger } from "../shared/logger.js";
import { VERSION, APP_NAME } from "../shared/constants.js";
import { startSession, endSession } from "../tools/monitor/tracker.js";
import { setCurrentSession } from "../tools/monitor/session.js";

/**
 * Start the ClawForge MCP stdio server.
 * Connects stdin/stdout to the MCP protocol and registers all tools.
 */
export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: APP_NAME,
    version: VERSION,
  });

  registerAllTools(server);

  const transport = new StdioServerTransport();

  logger.info("MCP server connecting", { version: VERSION });

  await server.connect(transport);

  // Start a session for this MCP server process
  const sessionId = startSession(process.cwd());
  setCurrentSession(sessionId);
  logger.info("MCP server running on stdio", { sessionId });

  // Keep alive — server runs until process exits
  process.on("SIGINT", async () => {
    endSession(sessionId);
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    endSession(sessionId);
    await server.close();
    process.exit(0);
  });
}
