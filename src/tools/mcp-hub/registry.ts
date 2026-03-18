/**
 * MCP server registry.
 * Track connected MCP servers and their discovered tools in ~/.clawforge/mcp/servers.json.
 */

import fs from "node:fs";
import path from "node:path";
import { MCP_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";

const SERVERS_FILE = path.join(MCP_DIR, "servers.json");

/** A registered MCP server. */
export interface McpServerEntry {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  discoveredTools: DiscoveredTool[];
}

/** A tool discovered from a child MCP server. */
export interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Load all registered servers from disk.
 * @returns Array of server entries.
 */
export function loadServers(): McpServerEntry[] {
  try {
    if (!fs.existsSync(SERVERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SERVERS_FILE, "utf-8")) as McpServerEntry[];
  } catch {
    return [];
  }
}

/**
 * Save servers to disk.
 * @param servers - Array of server entries.
 */
function saveServers(servers: McpServerEntry[]): void {
  fs.mkdirSync(MCP_DIR, { recursive: true });
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2), "utf-8");
}

/**
 * Register a new MCP server.
 * @param entry - Server configuration to register.
 */
export function registerServer(entry: Omit<McpServerEntry, "discoveredTools">): void {
  const servers = loadServers();
  const existing = servers.findIndex(s => s.name === entry.name);
  const full: McpServerEntry = { ...entry, discoveredTools: [] };

  if (existing >= 0) {
    servers[existing] = { ...servers[existing]!, ...full };
  } else {
    servers.push(full);
  }

  saveServers(servers);
  logger.info("MCP server registered", { name: entry.name });
}

/**
 * Update the discovered tools for a server.
 * @param serverName - Server name.
 * @param tools - Discovered tools array.
 */
export function updateDiscoveredTools(serverName: string, tools: DiscoveredTool[]): void {
  const servers = loadServers();
  const idx = servers.findIndex(s => s.name === serverName);
  if (idx >= 0) {
    servers[idx]!.discoveredTools = tools;
    saveServers(servers);
    logger.info("Tools updated for server", { server: serverName, count: tools.length });
  }
}

/**
 * Get a server by name.
 * @param name - Server name.
 * @returns Server entry or null.
 */
export function getServer(name: string): McpServerEntry | null {
  return loadServers().find(s => s.name === name) ?? null;
}

/**
 * Remove a server by name.
 * @param name - Server name to remove.
 */
export function removeServer(name: string): void {
  const servers = loadServers().filter(s => s.name !== name);
  saveServers(servers);
  logger.info("MCP server removed", { name });
}
