/**
 * Browser lifecycle controller.
 * Launch Playwright Chromium, manage lifecycle, graceful shutdown.
 */

import { chromium, type Browser, type BrowserContext } from "playwright";
import { logger } from "../../shared/logger.js";
import { BROWSER_TIMEOUT } from "../../shared/constants.js";

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Launch or get the existing browser instance.
 * @param headless - Whether to run headless (default true).
 * @returns The browser context.
 */
export async function getBrowserContext(headless: boolean = true): Promise<BrowserContext> {
  resetIdleTimer();

  if (context && browser?.isConnected()) {
    return context;
  }

  // Clean up stale references
  await closeBrowser();

  logger.info("Launching Chromium", { headless });
  browser = await chromium.launch({
    headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: "ClawForge/0.1.0",
  });

  context.setDefaultTimeout(BROWSER_TIMEOUT);

  // Handle browser disconnect
  browser.on("disconnected", () => {
    logger.warn("Browser disconnected");
    browser = null;
    context = null;
  });

  return context;
}

/**
 * Get the raw browser instance.
 * @returns The browser or null.
 */
export function getBrowser(): Browser | null {
  return browser;
}

/**
 * Reset the idle auto-close timer.
 */
function resetIdleTimer(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    logger.info("Browser idle timeout, closing");
    closeBrowser().catch(() => {});
  }, IDLE_TIMEOUT);
}

/**
 * Close the browser and clean up.
 */
export async function closeBrowser(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (context) {
    try { await context.close(); } catch { /* ignore */ }
    context = null;
  }
  if (browser) {
    try { await browser.close(); } catch { /* ignore */ }
    browser = null;
  }
  logger.debug("Browser closed");
}

/**
 * Check if a browser is currently active.
 * @returns True if browser is running.
 */
export function isBrowserActive(): boolean {
  return browser !== null && browser.isConnected();
}
