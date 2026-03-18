/**
 * Browser actions.
 * Navigate, click, type, scroll, select, wait for elements.
 */

import type { Page } from "playwright";
import { getBrowserContext } from "./controller.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

let activePage: Page | null = null;

/**
 * Get or create the active page.
 * @returns The active Playwright page.
 */
export async function getActivePage(): Promise<Page> {
  if (activePage && !activePage.isClosed()) {
    return activePage;
  }
  const ctx = await getBrowserContext();
  activePage = await ctx.newPage();
  return activePage;
}

/**
 * Navigate to a URL.
 * @param url - The URL to navigate to.
 * @param waitUntil - When to consider navigation complete.
 * @returns Tool result with page title.
 */
export async function navigate(url: string, waitUntil: "load" | "domcontentloaded" | "networkidle" = "load"): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    await page.goto(url, { waitUntil });
    const title = await page.title();
    logger.info("Navigated to URL", { url, title });
    return { success: true, data: { url, title } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Navigation failed: ${msg}` };
  }
}

/**
 * Click an element by CSS selector.
 * @param selector - CSS selector.
 * @returns Tool result.
 */
export async function click(selector: string): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    await page.click(selector);
    return { success: true, data: { selector, action: "clicked" } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Click failed: ${msg}` };
  }
}

/**
 * Type text into an element.
 * @param selector - CSS selector.
 * @param text - Text to type.
 * @returns Tool result.
 */
export async function type(selector: string, text: string): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    await page.fill(selector, text);
    return { success: true, data: { selector, text, action: "typed" } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Type failed: ${msg}` };
  }
}

/**
 * Scroll the page.
 * @param direction - "up" or "down".
 * @param amount - Pixels to scroll (default 500).
 * @returns Tool result.
 */
export async function scroll(direction: "up" | "down", amount: number = 500): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    const delta = direction === "down" ? amount : -amount;
    await page.mouse.wheel(0, delta);
    return { success: true, data: { direction, amount } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Scroll failed: ${msg}` };
  }
}

/**
 * Select an option from a dropdown.
 * @param selector - CSS selector of select element.
 * @param value - Value to select.
 * @returns Tool result.
 */
export async function select(selector: string, value: string): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    await page.selectOption(selector, value);
    return { success: true, data: { selector, value, action: "selected" } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Select failed: ${msg}` };
  }
}

/**
 * Wait for a selector to appear.
 * @param selector - CSS selector to wait for.
 * @param timeout - Max wait time in ms.
 * @returns Tool result.
 */
export async function waitForSelector(selector: string, timeout: number = 10000): Promise<ToolResult> {
  try {
    const page = await getActivePage();
    await page.waitForSelector(selector, { timeout });
    return { success: true, data: { selector, found: true } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Wait failed: ${msg}` };
  }
}
