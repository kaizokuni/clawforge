/**
 * MCP hub router.
 * Route tool calls to the correct child MCP server.
 */

import { getClient } from "./connector.js";
import { loadServers, getServer } from "./registry.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Route a tool call to a specific MCP server.
 * @param serverName - Target server name.
 * @param toolName - Tool to call on that server.
 * @param params - Tool parameters.
 * @returns Tool result from the child server.
 */
export async function routeToolCall(
  serverName: string,
  toolName: string,
  params: Record<string, unknown> = {}
): Promise<ToolResult> {
  const client = getClient(serverName);
  if (!client) {
    return { success: false, error: `Server not connected: ${serverName}. Call mcp_route with connect action first.` };
  }

  try {
    const result = await client.callTool({ name: toolName, arguments: params });
    logger.info("MCP tool routed", { server: serverName, tool: toolName });

    return {
      success: true,
      data: { server: serverName, tool: toolName, result: result.content },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("MCP route failed", { server: serverName, tool: toolName, error: msg });
    return { success: false, error: `Route failed: ${msg}` };
  }
}

/**
 * List all registered servers and their discovered tools.
 * @returns Tool result with servers and tool counts.
 */
export function listServers(): ToolResult {
  const servers = loadServers();
  return {
    success: true,
    data: {
      servers: servers.map(s => ({
        name: s.name,
        command: s.command,
        toolCount: s.discoveredTools.length,
        tools: s.discoveredTools.map(t => t.name),
      })),
    },
  };
}

/**
 * Find which server provides a given tool name.
 * @param toolName - Tool name to look up.
 * @returns Server name or null.
 */
export function findServerForTool(toolName: string): string | null {
  const servers = loadServers();
  for (const server of servers) {
    if (server.discoveredTools.some(t => t.name === toolName)) {
      return server.name;
    }
  }
  return null;
}
