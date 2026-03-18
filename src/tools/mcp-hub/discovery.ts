/**
 * MCP tool discovery.
 * On connect, call tools/list on the child server and cache results.
 */

import { connectServer, getClient } from "./connector.js";
import { updateDiscoveredTools } from "./registry.js";
import { logger } from "../../shared/logger.js";
import type { DiscoveredTool } from "./registry.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Connect to a server and discover its tools.
 * @param name - Server name.
 * @param command - Launch command.
 * @param args - Command arguments.
 * @param env - Environment overrides.
 * @returns Tool result with discovered tools.
 */
export async function discoverServerTools(
  name: string,
  command: string,
  args: string[] = [],
  env: Record<string, string> = {}
): Promise<ToolResult> {
  try {
    const client = await connectServer(name, command, args, env);
    const result = await client.listTools();

    const tools: DiscoveredTool[] = result.tools.map(t => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
    }));

    updateDiscoveredTools(name, tools);
    logger.info("Tools discovered", { server: name, count: tools.length });

    return {
      success: true,
      data: { server: name, tools },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Tool discovery failed", { server: name, error: msg });
    return { success: false, error: `Discovery failed for ${name}: ${msg}` };
  }
}

/**
 * Re-discover tools for an already-connected server.
 * @param name - Server name.
 * @returns Tool result with refreshed tools.
 */
export async function refreshServerTools(name: string): Promise<ToolResult> {
  const client = getClient(name);
  if (!client) {
    return { success: false, error: `Server not connected: ${name}` };
  }

  try {
    const result = await client.listTools();
    const tools: DiscoveredTool[] = result.tools.map(t => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
    }));

    updateDiscoveredTools(name, tools);
    return { success: true, data: { server: name, tools } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Refresh failed: ${msg}` };
  }
}
