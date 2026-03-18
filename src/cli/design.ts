/**
 * CLI: clawforge design <action>
 * Design preview loop commands.
 */

import { Command } from "commander";
import fs from "node:fs";
import { previewDesign } from "../tools/design/previewer.js";
import { captureForIteration } from "../tools/design/iterator.js";

export function makeDesignCommand(): Command {
  const cmd = new Command("design").description("Design preview and iteration loop");

  cmd.command("preview <html-file>")
    .description("Preview an HTML file in the browser and take a screenshot")
    .option("--css <file>", "CSS file to inject")
    .option("--width <n>", "Viewport width", "1280")
    .option("--height <n>", "Viewport height", "720")
    .action(async (htmlFile: string, opts: { css?: string; width: string; height: string }) => {
      try {
        const html = fs.readFileSync(htmlFile, "utf-8");
        const css = opts.css ? fs.readFileSync(opts.css, "utf-8") : undefined;
        const viewport = { width: parseInt(opts.width, 10), height: parseInt(opts.height, 10) };
        const result = await previewDesign(html, css, viewport);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("capture")
    .description("Capture the current browser state for design iteration")
    .option("--base64", "Return screenshot as base64")
    .action(async (opts: { base64?: boolean }) => {
      try {
        const result = await captureForIteration(opts.base64);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
