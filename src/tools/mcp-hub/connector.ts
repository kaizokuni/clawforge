/**
 * MCP server connector.
 * Spawn child MCP server processes via stdio using @modelcontextprotocol/sdk Client.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { registerServer, updateDiscoveredTools } from "./registry.js";
import { logger } from "../../shared/logger.js";
import type { DiscoveredTool } from "./registry.js";

/** Active client connections keyed by server name. */
const activeClients: Map<string, Client> = new Map();

/**
 * Connect to a child MCP server via stdio.
 * @param name - Server name.
 * @param command - Command to launch the server.
 * @param args - Command arguments.
 * @param env - Additional environment variables.
 * @returns The connected MCP Client.
 */
export async function connectServer(
  name: string,
  command: string,
  args: string[] = [],
  env: Record<string, string> = {}
): Promise<Client> {
  // Disconnect existing if present
  await disconnectServer(name);

  registerServer({ name, command, args, env });

  const transport = new StdioClientTransport({
    command,
    args,
    env: { ...process.env as Record<string, string>, ...env },
  });

  const client = new Client(
    { name: "clawforge-hub", version: "0.1.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  activeClients.set(name, client);
  logger.info("MCP server connected", { name, command });
  return client;
}

/**
 * Disconnect from a child MCP server.
 * @param name - Server name.
 */
export async function disconnectServer(name: string): Promise<void> {
  const client = activeClients.get(name);
  if (client) {
    try { await client.close(); } catch { /* ignore */ }
    activeClients.delete(name);
    logger.info("MCP server disconnected", { name });
  }
}

/**
 * Get an active client by server name.
 * @param name - Server name.
 * @returns The MCP Client or null.
 */
export function getClient(name: string): Client | null {
  return activeClients.get(name) ?? null;
}

/**
 * List all active server connections.
 * @returns Array of server names.
 */
export function listActiveServers(): string[] {
  return Array.from(activeClients.keys());
}

/**
 * Disconnect all active servers.
 */
export async function disconnectAll(): Promise<void> {
  for (const name of activeClients.keys()) {
    await disconnectServer(name);
  }
}
