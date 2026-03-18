/**
 * Marketplace searcher.
 * Search and filter components by type, keyword, and category.
 */

import { loadRegistry } from "./registry.js";
import { logger } from "../../shared/logger.js";
import type { ComponentType, MarketplaceEntry, ToolResult } from "../../shared/types.js";

export interface SearchOptions {
  query?: string;
  type?: ComponentType;
  tag?: string;
  limit?: number;
}

/**
 * Search the marketplace registry.
 * @param options - Search filters.
 * @returns Tool result with matching components.
 */
export function searchMarketplace(options: SearchOptions = {}): ToolResult {
  const { query = "", type, tag, limit = 50 } = options;

  let entries = loadRegistry();

  // Filter by type
  if (type) {
    entries = entries.filter(e => e.type === type);
  }

  // Filter by tag
  if (tag) {
    const lowerTag = tag.toLowerCase();
    entries = entries.filter(e => e.tags.some(t => t.toLowerCase().includes(lowerTag)));
  }

  // Filter by keyword (name + description + tags)
  if (query.trim()) {
    const q = query.toLowerCase();
    entries = entries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by downloads descending
  entries.sort((a, b) => b.downloads - a.downloads);

  const results = entries.slice(0, limit);
  logger.info("Marketplace search", { query, type, tag, resultCount: results.length });

  return {
    success: true,
    data: { components: results, total: results.length },
  };
}

/**
 * List all components of a specific type.
 * @param type - Component type to list.
 * @returns Tool result with components.
 */
export function listByType(type: ComponentType): ToolResult {
  return searchMarketplace({ type });
}

/**
 * Get featured/popular components.
 * @param limit - How many to return.
 * @returns Tool result with top components.
 */
export function getFeatured(limit: number = 10): ToolResult {
  const entries = loadRegistry()
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit);

  return {
    success: true,
    data: { components: entries, total: entries.length },
  };
}
