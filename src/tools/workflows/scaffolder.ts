/**
 * Workflow scaffolder.
 * Generates a template .yaml workflow file.
 */

import fs from "node:fs";
import path from "node:path";
import { CLAWFORGE_HOME } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

const WORKFLOWS_DIR = path.join(CLAWFORGE_HOME, "workflows");

/**
 * Scaffold a new workflow definition.
 * @param name - Workflow name.
 * @param description - Short description.
 * @param outputDir - Override output directory (defaults to ~/.clawforge/workflows/).
 * @returns Tool result with the path to the created file.
 */
export function scaffoldWorkflow(
  name: string,
  description: string = "TODO: describe this workflow",
  outputDir: string = WORKFLOWS_DIR
): ToolResult {
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${cleanName}.yaml`);

    if (fs.existsSync(filePath)) {
      return { success: false, error: `Workflow already exists: ${filePath}` };
    }

    const template = `name: ${cleanName}
description: ${description}

steps:
  # Each step is one of: skill, agent, or command
  # The output of each step becomes the input context for the next step.

  - skill: research
    instruction: "Research best approaches for the task"

  - agent: code-writer
    instruction: "Implement the solution based on the research"

  - command: /generate-tests
    instruction: "Generate tests for the new code"

  # Add more steps as needed:
  # - skill: <skill-name>
  #   instruction: "What to do in this step"
  # - agent: <agent-name>
  #   instruction: "What to ask the agent"
  # - command: /<command-name>
  #   instruction: "Task for this command"
`;

    fs.writeFileSync(filePath, template, "utf-8");
    logger.info("Workflow scaffolded", { name: cleanName, path: filePath });

    return { success: true, data: { name: cleanName, path: filePath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Scaffold failed: ${msg}` };
  }
}
