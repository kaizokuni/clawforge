/**
 * Agent scaffolder.
 * Generate template .md agent files.
 */

import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Create a new agent template file.
 * @param name - Agent name (used as filename).
 * @param description - Short description.
 * @param tools - Array of tool names the agent can use.
 * @param outputDir - Directory to write to (default: ~/.clawforge/agents/).
 * @returns Tool result with the created file path.
 */
export function scaffoldAgent(
  name: string,
  description: string = "A specialized ClawForge agent",
  tools: string[] = [],
  outputDir: string = AGENTS_DIR
): ToolResult {
  fs.mkdirSync(outputDir, { recursive: true });

  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const filePath = path.join(outputDir, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    return { success: false, error: `Agent already exists: ${filePath}` };
  }

  const toolsList = tools.length > 0 ? tools.join(", ") : "memory_search, web_search, index_search";

  const template = `---
name: ${slug}
description: "${description}"
tools: [${toolsList}]
model: claude-sonnet-4-20250514
---

You are ${name}, a specialized ClawForge agent.

## Role
${description}

## Behavior
- Be concise and focused on your specialty
- Use only your allowed tools
- Return structured, actionable results
- If you cannot complete a task with available tools, explain what is needed

## Instructions
<!-- Add specific instructions for this agent here -->
`;

  fs.writeFileSync(filePath, template, "utf-8");
  logger.info("Agent scaffolded", { name, path: filePath });
  return { success: true, data: { name, path: filePath } };
}
