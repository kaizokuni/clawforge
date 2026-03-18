/**
 * CLI: clawforge browser <action>
 * Browser control commands via Playwright.
 */

import { Command } from "commander";
import { navigate } from "../tools/browser/actions.js";
import { screenshot, content } from "../tools/browser/capture.js";
import { click, type as typeText } from "../tools/browser/actions.js";
import { closeBrowser } from "../tools/browser/controller.js";

export function makeBrowserCommand(): Command {
  const cmd = new Command("browser").description("Control the Playwright browser");

  cmd.command("open <url>")
    .description("Open a URL in the browser")
    .option("--wait <event>", "Wait for: load | domcontentloaded | networkidle", "load")
    .action(async (url: string, opts: { wait: string }) => {
      try {
        await navigate(url, opts.wait as "load" | "domcontentloaded" | "networkidle");
        console.log(`Opened: ${url}`);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("screenshot")
    .description("Take a screenshot of the current page")
    .option("--selector <css>", "CSS selector to capture")
    .option("--full-page", "Capture full page")
    .action(async (opts: { selector?: string; fullPage?: boolean }) => {
      try {
        const result = await screenshot(opts);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("click <selector>")
    .description("Click an element by CSS selector")
    .action(async (selector: string) => {
      try {
        await click(selector);
        console.log(`Clicked: ${selector}`);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("type <selector> <text>")
    .description("Type text into an input element")
    .action(async (selector: string, text: string) => {
      try {
        await typeText(selector, text);
        console.log(`Typed into: ${selector}`);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("content")
    .description("Extract readable text content from the current page")
    .action(async () => {
      try {
        const text = await content();
        console.log(text);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("close")
    .description("Close the browser")
    .action(async () => {
      try {
        await closeBrowser();
        console.log("Browser closed.");
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
