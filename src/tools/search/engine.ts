/**
 * Web search engine.
 * DuckDuckGo HTML scraping, parse results with cheerio.
 */

import * as cheerio from "cheerio";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/** A single search result. */
export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Search DuckDuckGo and return parsed results.
 * @param query - Search query string.
 * @param maxResults - Maximum number of results to return.
 * @returns Tool result with search results array.
 */
export async function searchDuckDuckGo(query: string, maxResults: number = 10): Promise<ToolResult> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ClawForge/0.1.0 (search tool)",
        "Accept": "text/html",
      },
    });

    if (!response.ok) {
      return { success: false, error: `DuckDuckGo returned ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $(".result").each((_i, el) => {
      if (results.length >= maxResults) return false;

      const titleEl = $(el).find(".result__title a");
      const snippetEl = $(el).find(".result__snippet");

      const title = titleEl.text().trim();
      const snippet = snippetEl.text().trim();
      let href = titleEl.attr("href") ?? "";

      // DuckDuckGo wraps URLs in a redirect
      if (href.includes("uddg=")) {
        const match = href.match(/uddg=([^&]+)/);
        if (match?.[1]) {
          href = decodeURIComponent(match[1]);
        }
      }

      if (title && href) {
        results.push({ title, snippet, url: href });
      }
    });

    logger.info("Web search completed", { query, resultCount: results.length });
    return { success: true, data: { query, results } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Search failed: ${msg}` };
  }
}
