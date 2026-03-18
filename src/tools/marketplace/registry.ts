/**
 * Marketplace registry.
 * Manages the local JSON registry cache at ~/.clawforge/marketplace/registry.json.
 * Future: fetches from remote registry API.
 */

import fs from "node:fs";
import path from "node:path";
import { MARKETPLACE_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { MarketplaceEntry, ComponentType, ToolResult } from "../../shared/types.js";

const REGISTRY_PATH = path.join(MARKETPLACE_DIR, "registry.json");

/** Empty registry seed. */
const EMPTY_REGISTRY: { components: MarketplaceEntry[] } = { components: [] };

/**
 * Load the marketplace registry from local cache.
 * Creates an empty registry file if it doesn't exist.
 * @returns Array of MarketplaceEntry.
 */
export function loadRegistry(): MarketplaceEntry[] {
  try {
    fs.mkdirSync(MARKETPLACE_DIR, { recursive: true });

    if (!fs.existsSync(REGISTRY_PATH)) {
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(EMPTY_REGISTRY, null, 2), "utf-8");
      return [];
    }

    const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
    const data = JSON.parse(raw) as { components: MarketplaceEntry[] };
    return data.components ?? [];
  } catch (err) {
    logger.error("Failed to load marketplace registry", { error: String(err) });
    return [];
  }
}

/**
 * Save the registry back to disk.
 * @param entries - Updated entries array.
 */
export function saveRegistry(entries: MarketplaceEntry[]): void {
  fs.mkdirSync(MARKETPLACE_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify({ components: entries }, null, 2), "utf-8");
  logger.info("Marketplace registry saved", { count: entries.length });
}

/**
 * Get a single registry entry by name and type.
 * @param name - Component name.
 * @param type - Component type (optional).
 * @returns MarketplaceEntry or undefined.
 */
export function getEntry(name: string, type?: ComponentType): MarketplaceEntry | undefined {
  const entries = loadRegistry();
  return entries.find(e => e.name === name && (type === undefined || e.type === type));
}

/**
 * Refresh registry from remote URL (future implementation).
 * Currently a no-op that logs the intent.
 * @param registryUrl - Remote registry URL.
 * @returns Tool result.
 */
export async function refreshRegistry(registryUrl: string): Promise<ToolResult> {
  logger.info("Registry refresh requested", { registryUrl, note: "Remote fetch not yet implemented" });
  const entries = loadRegistry();
  return {
    success: true,
    data: { count: entries.length, source: "local-cache" },
  };
}
