/**
 * Slash command scaffolder.
 * Generates a template .md command file in ~/.clawforge/commands/.
 */

import fs from "node:fs";
import path from "node:path";
import { COMMANDS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Scaffold a new slash command template.
 * @param name - Command name (no spaces, no leading slash).
 * @param description - Short description of what the command does.
 * @param category - Category (e.g. "git", "testing", "docs").
 * @param outputDir - Override output directory (defaults to COMMANDS_DIR).
 * @returns Tool result with the path to the created file.
 */
export function scaffoldCommand(
  name: string,
  description: string = "TODO: describe this command",
  category: string = "general",
  outputDir: string = COMMANDS_DIR
): ToolResult {
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${cleanName}.md`);

    if (fs.existsSync(filePath)) {
      return { success: false, error: `Command already exists: ${filePath}` };
    }

    const template = `---
name: ${cleanName}
description: ${description}
category: ${category}
---

# /${cleanName}

## Purpose
TODO: Describe what this command does.

## Instructions

1. TODO: Add step-by-step instructions here.
2. These instructions are injected as context and followed by Claude Code.
3. You can reference files, patterns, or workflows.

## Example Usage
\`\`\`
/${cleanName} <target>
\`\`\`
`;

    fs.writeFileSync(filePath, template, "utf-8");
    logger.info("Command scaffolded", { name: cleanName, path: filePath });

    return { success: true, data: { name: cleanName, path: filePath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Scaffold failed: ${msg}` };
  }
}
