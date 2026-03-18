/**
 * Design previewer.
 * Save HTML to temp file → open in browser → screenshot → return path.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { navigate } from "../browser/actions.js";
import { screenshot } from "../browser/capture.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Preview an HTML string by rendering it in the browser and taking a screenshot.
 * @param html - The HTML content to preview.
 * @param css - Optional CSS to inject.
 * @param viewport - Optional viewport size.
 * @returns Tool result with screenshot path.
 */
export async function previewDesign(
  html: string,
  css?: string,
  viewport?: { width: number; height: number }
): Promise<ToolResult> {
  try {
    const tmpDir = path.join(os.tmpdir(), "clawforge", "design");
    fs.mkdirSync(tmpDir, { recursive: true });

    // Build full HTML with optional CSS
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${css ? `<style>${css}</style>` : ""}
</head>
<body>
${html}
</body>
</html>`;

    const htmlPath = path.join(tmpDir, `preview-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, fullHtml, "utf-8");

    // Navigate to the file
    const fileUrl = `file://${htmlPath.replace(/\\/g, "/")}`;
    const navResult = await navigate(fileUrl);
    if (!navResult.success) {
      return navResult;
    }

    // Take screenshot
    const screenshotPath = path.join(tmpDir, `preview-${Date.now()}.png`);
    const result = await screenshot({ outputPath: screenshotPath, fullPage: true });

    if (result.success) {
      logger.info("Design preview created", { htmlPath, screenshotPath });
      return {
        success: true,
        data: {
          htmlPath,
          screenshotPath,
          fileUrl,
        },
      };
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Preview failed: ${msg}` };
  }
}
