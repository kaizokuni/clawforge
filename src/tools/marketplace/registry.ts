/**
 * Marketplace registry.
 * Manages the local JSON registry cache at ~/.clawforge/marketplace/registry.json.
 * Populates from built-in bundled components; optionally merges a remote JSON registry.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse as yamlParse } from "yaml";
import { MARKETPLACE_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { MarketplaceEntry, ComponentType, ToolResult } from "../../shared/types.js";

/** Package root — two directories above dist/tools/marketplace/ */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "../../..");

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

// ─── Built-in scanner ────────────────────────────────────────────────────────

interface ScanConfig {
  dir: string;
  type: ComponentType;
  ext: ".md" | ".yaml";
  tags: string[];
}

const BUILTIN_SCAN: ScanConfig[] = [
  { dir: "agents",    type: "agent",    ext: ".md",   tags: ["built-in", "agent"]    },
  { dir: "commands",  type: "command",  ext: ".md",   tags: ["built-in", "command"]  },
  { dir: "hooks",     type: "hook",     ext: ".md",   tags: ["built-in", "hook"]     },
  { dir: "settings",  type: "setting",  ext: ".yaml", tags: ["built-in", "setting"]  },
  { dir: "bundles",   type: "bundle",   ext: ".yaml", tags: ["built-in", "bundle"]   },
  { dir: "workflows", type: "workflow", ext: ".yaml", tags: ["built-in", "workflow"] },
  { dir: "stacks",    type: "stack",    ext: ".yaml", tags: ["built-in", "stack"]    },
];

/**
 * Scan built-in component directories in the package root and return registry entries.
 * @returns Array of MarketplaceEntry from bundled components.
 */
function scanBuiltins(): MarketplaceEntry[] {
  const entries: MarketplaceEntry[] = [];

  for (const config of BUILTIN_SCAN) {
    const dir = path.join(PACKAGE_ROOT, config.dir);
    if (!fs.existsSync(dir)) continue;

    let files: string[];
    try {
      files = fs.readdirSync(dir).filter(
        f => path.extname(f).toLowerCase() === config.ext && f !== "AGENTS.md" && !f.startsWith("."),
      );
    } catch (err) {
      logger.warn("Failed to read built-in dir", { dir, error: String(err) });
      continue;
    }

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        let name: string;
        let description: string;

        if (config.ext === ".md") {
          const { data } = matter(raw);
          name = String(data["name"] ?? path.basename(file, ".md"));
          description = String(data["description"] ?? "");
        } else {
          const data = yamlParse(raw) as Record<string, unknown>;
          name = String(data["name"] ?? path.basename(file, ".yaml"));
          description = String(data["description"] ?? "");
        }

        entries.push({
          name,
          type: config.type,
          description,
          version: "1.0.0",
          author: "clawforge",
          downloads: 0,
          tags: [...config.tags],
        });
      } catch (err) {
        logger.warn("Failed to parse built-in component", { file, error: String(err) });
      }
    }
  }

  return entries;
}

/**
 * Fetch remote registry JSON and return entries, with graceful fallback.
 * Expects the remote to return `{ components: MarketplaceEntry[] }`.
 * @param url - Remote registry URL.
 * @returns Array of entries, empty on any failure.
 */
async function fetchRemote(url: string): Promise<MarketplaceEntry[]> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      logger.warn("Remote registry fetch failed", { url, status: response.status });
      return [];
    }
    const json = (await response.json()) as { components?: MarketplaceEntry[] };
    const remote = Array.isArray(json.components) ? json.components : [];
    logger.info("Remote registry fetched", { url, count: remote.length });
    return remote;
  } catch (err) {
    logger.warn("Remote registry unreachable", { url, error: String(err) });
    return [];
  }
}

/**
 * Refresh registry: scan built-in components, optionally merge remote entries,
 * and preserve any existing user-installed (non-clawforge) entries.
 * @param registryUrl - Optional remote registry URL to merge.
 * @returns Tool result with counts.
 */
export async function refreshRegistry(registryUrl?: string): Promise<ToolResult> {
  logger.info("Registry refresh started", { registryUrl: registryUrl ?? "none" });

  const builtins = scanBuiltins();

  // Fetch remote entries only when a URL is provided and looks like http(s)
  const remote =
    registryUrl && (registryUrl.startsWith("http://") || registryUrl.startsWith("https://"))
      ? await fetchRemote(registryUrl)
      : [];

  // Preserve existing user-installed entries (author !== "clawforge")
  const existing = loadRegistry();
  const userInstalled = existing.filter(e => e.author !== "clawforge");

  // Merge: builtins first, then remote overrides, then user-installed fills gaps
  const merged: MarketplaceEntry[] = [...builtins];

  for (const entry of remote) {
    const idx = merged.findIndex(e => e.name === entry.name && e.type === entry.type);
    if (idx >= 0) {
      merged[idx] = entry; // remote version wins
    } else {
      merged.push(entry);
    }
  }

  for (const entry of userInstalled) {
    const exists = merged.some(e => e.name === entry.name && e.type === entry.type);
    if (!exists) merged.push(entry);
  }

  saveRegistry(merged);

  logger.info("Registry refreshed", {
    builtins: builtins.length,
    remote: remote.length,
    userInstalled: userInstalled.length,
    total: merged.length,
  });

  return {
    success: true,
    data: {
      count: merged.length,
      builtins: builtins.length,
      remote: remote.length,
      source: remote.length > 0 ? "built-in+remote" : "built-in",
    },
  };
}
