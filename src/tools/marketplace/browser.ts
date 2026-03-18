/**
 * Marketplace interactive browser.
 * Returns formatted component listings for display.
 * Full Ink TUI wired in Phase 5 CLI.
 */

import { searchMarketplace, getFeatured } from "./searcher.js";
import { installFromPath, installFromUrl } from "./installer.js";
import { logger } from "../../shared/logger.js";
import type { ComponentType, MarketplaceEntry, ToolResult } from "../../shared/types.js";

/**
 * Browse the marketplace — returns a formatted text listing.
 * @param query - Optional search query.
 * @param type - Optional type filter.
 * @returns Tool result with formatted component list.
 */
export function browseMarketplace(query?: string, type?: ComponentType): ToolResult {
  const result = query || type
    ? searchMarketplace({ query, type })
    : getFeatured(20);

  if (!result.success) return result;

  const data = result.data as { components: MarketplaceEntry[] };
  const components = data.components;

  if (components.length === 0) {
    return {
      success: true,
      data: {
        components: [],
        formatted: "No components found. Try `clawforge marketplace search <query>`.",
      },
    };
  }

  // Format as a text table for terminal display
  const lines = [
    "┌─────────────────────────────────────────────────────────────────────┐",
    "│  🦀 ClawForge Marketplace                                           │",
    "└─────────────────────────────────────────────────────────────────────┘",
    "",
    `  ${components.length} component(s) found`,
    "",
  ];

  const byType = new Map<string, MarketplaceEntry[]>();
  for (const c of components) {
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type)!.push(c);
  }

  for (const [typeName, items] of byType) {
    lines.push(`  ── ${typeName.toUpperCase()}S ───────────────────────────────────────`);
    for (const item of items) {
      const tags = item.tags.length > 0 ? ` [${item.tags.slice(0, 3).join(", ")}]` : "";
      lines.push(`  ${item.name.padEnd(28)} v${item.version}  ${item.author}  ↓${item.downloads}`);
      lines.push(`    ${item.description}${tags}`);
    }
    lines.push("");
  }

  logger.info("Marketplace browsed", { query, type, count: components.length });

  return {
    success: true,
    data: {
      components,
      formatted: lines.join("\n"),
    },
  };
}

/**
 * Install a component interactively (by name from registry or by path/URL).
 * @param nameOrPath - Component name, local path, or URL.
 * @param type - Optional type hint.
 * @returns Tool result.
 */
export async function interactiveInstall(nameOrPath: string, type?: ComponentType): Promise<ToolResult> {
  // URL install
  if (nameOrPath.startsWith("http://") || nameOrPath.startsWith("https://")) {
    return installFromUrl(nameOrPath, type);
  }

  // Local path install
  return installFromPath(nameOrPath, type);
}
