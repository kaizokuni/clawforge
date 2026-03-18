/**
 * Page fetcher.
 * Fetch any URL, extract readable article with Readability + cheerio.
 */

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/** Fetched page content. */
export interface FetchedPage {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
}

/**
 * Fetch a URL and extract readable content.
 * @param url - The URL to fetch.
 * @param maxLength - Maximum content length in characters.
 * @returns Tool result with extracted page content.
 */
export async function fetchPage(url: string, maxLength: number = 20000): Promise<ToolResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ClawForge/0.1.0 (page fetcher)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, error: `Fetch failed: HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return { success: false, error: `Non-HTML content: ${contentType}` };
    }

    const html = await response.text();

    // Try Readability first
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article && article.textContent.trim().length > 100) {
        const text = article.textContent.trim().slice(0, maxLength);
        const page: FetchedPage = {
          url,
          title: article.title,
          content: text,
          excerpt: article.excerpt ?? text.slice(0, 200),
          wordCount: text.split(/\s+/).length,
        };
        logger.info("Page fetched with Readability", { url, wordCount: page.wordCount });
        return { success: true, data: page };
      }
    } catch {
      // Readability failed, fall through to cheerio
    }

    // Fallback: cheerio text extraction
    const $ = cheerio.load(html);
    $("script, style, nav, header, footer, iframe, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, maxLength);
    const title = $("title").text().trim();

    const page: FetchedPage = {
      url,
      title,
      content: text,
      excerpt: text.slice(0, 200),
      wordCount: text.split(/\s+/).length,
    };

    logger.info("Page fetched with cheerio fallback", { url, wordCount: page.wordCount });
    return { success: true, data: page };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Fetch failed: ${msg}` };
  }
}
