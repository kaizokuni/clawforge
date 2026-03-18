/**
 * Design iterator.
 * Take screenshot of current preview, return for LLM evaluation.
 */

import fs from "node:fs";
import { screenshot } from "../browser/capture.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Capture the current design preview for iteration.
 * Returns the screenshot path and optionally base64 content.
 * @param returnBase64 - Whether to include base64 encoded image.
 * @returns Tool result with screenshot data.
 */
export async function captureForIteration(returnBase64: boolean = false): Promise<ToolResult> {
  try {
    const result = await screenshot({ fullPage: true });

    if (!result.success) return result;

    const screenshotPath = (result.data as { path: string }).path;

    let base64: string | undefined;
    if (returnBase64) {
      const buffer = fs.readFileSync(screenshotPath);
      base64 = buffer.toString("base64");
    }

    logger.info("Design iteration captured", { path: screenshotPath });
    return {
      success: true,
      data: {
        screenshotPath,
        ...(base64 ? { base64 } : {}),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Iteration capture failed: ${msg}` };
  }
}
