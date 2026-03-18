/**
 * Browser capture: screenshots, content extraction, PDF.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { getActivePage } from "./actions.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Take a screenshot of the current page.
 * @param options - Screenshot options.
 * @returns Tool result with file path.
 */
export async function screenshot(options?: {
  selector?: string;
  fullPage?: boolean;
  outputPath?: string;
}): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    const fileName = `screenshot-${Date.now()}.png`;
    const outputPath = options?.outputPath ?? path.join(os.tmpdir(), "clawforge", fileName);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    if (options?.selector) {
      const element = page.locator(options.selector);
      await element.screenshot({ path: outputPath });
    } else {
      await page.screenshot({
        path: outputPath,
        fullPage: options?.fullPage ?? false,
      });
    }

    logger.info("Screenshot saved", { path: outputPath });
    return { success: true, data: { path: outputPath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Screenshot failed: ${msg}` };
  }
}

/**
 * Extract readable text content from the current page.
 * Uses @mozilla/readability for article extraction.
 * @returns Tool result with extracted text.
 */
export async function content(): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    const html = await page.content();
    const url = page.url();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      return {
        success: true,
        data: {
          title: article.title,
          content: article.textContent.trim(),
          excerpt: article.excerpt ?? "",
          length: article.length,
        },
      };
    }

    // Fallback: get all visible text
    const text = await page.innerText("body");
    return {
      success: true,
      data: {
        title: await page.title(),
        content: text.slice(0, 10000),
        excerpt: text.slice(0, 200),
        length: text.length,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Content extraction failed: ${msg}` };
  }
}

/**
 * Save the current page as a PDF.
 * @param outputPath - Optional output path.
 * @returns Tool result with file path.
 */
export async function pdf(outputPath?: string): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    const fileName = `page-${Date.now()}.pdf`;
    const filePath = outputPath ?? path.join(os.tmpdir(), "clawforge", fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await page.pdf({ path: filePath, format: "A4" });

    logger.info("PDF saved", { path: filePath });
    return { success: true, data: { path: filePath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `PDF failed: ${msg}` };
  }
}
