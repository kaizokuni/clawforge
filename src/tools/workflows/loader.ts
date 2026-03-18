/**
 * Workflow loader.
 * Parses .yaml workflow definitions from ~/.clawforge/workflows/ and ./workflows/.
 * Each workflow has a name and ordered steps (skill/agent/command).
 */

import fs from "node:fs";
import path from "node:path";
import { parse as yamlParse } from "yaml";
import { CLAWFORGE_HOME } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { WorkflowDefinition, WorkflowStep } from "../../shared/types.js";

const WORKFLOWS_DIR = path.join(CLAWFORGE_HOME, "workflows");

/**
 * Load all workflow definitions from global and local directories.
 * @param localDir - Optional local workflows directory.
 * @returns Array of WorkflowDefinition.
 */
export function loadWorkflows(localDir?: string): WorkflowDefinition[] {
  const dirs: string[] = [WORKFLOWS_DIR];
  if (localDir) dirs.push(localDir);

  const seen = new Set<string>();
  const workflows: WorkflowDefinition[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = yamlParse(raw) as Record<string, unknown>;

        const name: string = (data["name"] as string) ?? path.basename(file, path.extname(file));
        if (seen.has(name)) continue;
        seen.add(name);

        const rawSteps = (data["steps"] as Array<Record<string, string>>) ?? [];
        const steps: WorkflowStep[] = rawSteps.map(s => {
          let type: WorkflowStep["type"] = "command";
          let stepName = "";

          if (s["skill"]) { type = "skill"; stepName = s["skill"]!; }
          else if (s["agent"]) { type = "agent"; stepName = s["agent"]!; }
          else if (s["command"]) { type = "command"; stepName = s["command"]!; }

          return {
            type,
            name: stepName,
            instruction: s["instruction"] ?? "",
          };
        });

        workflows.push({
          name,
          description: (data["description"] as string) ?? "",
          steps,
        });
      } catch (err) {
        logger.warn("Failed to load workflow", { file: filePath, error: String(err) });
      }
    }
  }

  logger.info("Workflows loaded", { count: workflows.length });
  return workflows;
}

/**
 * Load a single workflow by name.
 * @param name - Workflow name.
 * @param localDir - Optional local workflows directory.
 * @returns WorkflowDefinition or undefined.
 */
export function loadWorkflow(name: string, localDir?: string): WorkflowDefinition | undefined {
  return loadWorkflows(localDir).find(w => w.name === name);
}
