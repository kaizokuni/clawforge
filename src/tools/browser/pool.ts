/**
 * Browser instance pool.
 * Reuse browser instances across calls. Max 1 browser, auto-close after idle.
 */

import { getBrowserContext, closeBrowser, isBrowserActive } from "./controller.js";
import { logger } from "../../shared/logger.js";

/** Pool status information. */
export interface PoolStatus {
  active: boolean;
  pageCount: number;
}

/**
 * Get the current pool status.
 * @returns Pool status info.
 */
export async function getPoolStatus(): Promise<PoolStatus> {
  if (!isBrowserActive()) {
    return { active: false, pageCount: 0 };
  }
  try {
    const ctx = await getBrowserContext();
    const pages = ctx.pages();
    return { active: true, pageCount: pages.length };
  } catch {
    return { active: false, pageCount: 0 };
  }
}

/**
 * Ensure the browser pool is warmed up.
 * Pre-launches the browser so subsequent calls are fast.
 */
export async function warmPool(): Promise<void> {
  try {
    await getBrowserContext();
    logger.info("Browser pool warmed");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Failed to warm browser pool", { error: msg });
  }
}

/**
 * Close all pages and the browser.
 */
export async function drainPool(): Promise<void> {
  await closeBrowser();
  logger.info("Browser pool drained");
}
