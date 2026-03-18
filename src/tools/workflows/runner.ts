/**
 * Workflow runner.
 * Executes workflow steps in sequence.
 * Output of step N becomes input context for step N+1.
 * Stops on failure, reports which step failed.
 */

import { loadWorkflow, loadWorkflows } from "./loader.js";
import { runSkill } from "../skills/executor.js";
import { runCommand } from "../commands/executor.js";
import { runAgent } from "../agents/runner.js";
import { logger } from "../../shared/logger.js";
import type { WorkflowStep, ToolResult } from "../../shared/types.js";

export interface WorkflowStepResult {
  step: number;
  type: WorkflowStep["type"];
  name: string;
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Execute a workflow by name.
 * @param name - Workflow name.
 * @param initialContext - Initial context passed to the first step.
 * @param apiKey - Claude API key for agent steps.
 * @param localDir - Optional local workflows/components directory.
 * @returns Tool result with per-step results.
 */
export async function runWorkflow(
  name: string,
  initialContext: string = "",
  apiKey?: string,
  localDir?: string
): Promise<ToolResult> {
  const workflow = loadWorkflow(name, localDir);
  if (!workflow) {
    return { success: false, error: `No workflow found: "${name}"` };
  }

  logger.info("Workflow started", { name: workflow.name, steps: workflow.steps.length });

  const stepResults: WorkflowStepResult[] = [];
  let context = initialContext;

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i]!;
    const task = [step.instruction, context].filter(Boolean).join("\n\n---\nPrevious context:\n");

    logger.info("Workflow step starting", {
      workflow: name,
      step: i + 1,
      type: step.type,
      name: step.name,
    });

    let result: ToolResult;

    try {
      if (step.type === "skill") {
        result = runSkill(step.name, task, localDir);
      } else if (step.type === "command") {
        result = runCommand(step.name, task, localDir);
      } else if (step.type === "agent") {
        result = await runAgent(step.name, task, apiKey, localDir);
      } else {
        result = { success: false, error: `Unknown step type: ${(step as WorkflowStep).type}` };
      }
    } catch (err) {
      result = {
        success: false,
        error: `Step threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    const stepResult: WorkflowStepResult = {
      step: i + 1,
      type: step.type,
      name: step.name,
      success: result.success,
      error: result.error,
    };

    // Extract text output from step result for context chaining
    if (result.success && result.data) {
      const data = result.data as Record<string, unknown>;
      stepResult.output = (data["context"] as string) ??
        (data["response"] as string) ??
        JSON.stringify(data).slice(0, 500);
      context = stepResult.output;
    }

    stepResults.push(stepResult);

    if (!result.success) {
      logger.warn("Workflow step failed, stopping", { workflow: name, step: i + 1, error: result.error });
      return {
        success: false,
        error: `Workflow "${name}" failed at step ${i + 1} (${step.type}:${step.name}): ${result.error}`,
        data: {
          workflow: name,
          completedSteps: i,
          totalSteps: workflow.steps.length,
          steps: stepResults,
        },
      };
    }

    logger.info("Workflow step completed", { workflow: name, step: i + 1 });
  }

  logger.info("Workflow completed", { name: workflow.name, steps: workflow.steps.length });

  return {
    success: true,
    data: {
      workflow: name,
      completedSteps: workflow.steps.length,
      totalSteps: workflow.steps.length,
      steps: stepResults,
      finalOutput: context,
    },
  };
}

/**
 * List all available workflows.
 * @param localDir - Optional local workflows directory.
 * @returns Tool result with workflows array.
 */
export function listWorkflows(localDir?: string): ToolResult {
  const workflows = loadWorkflows(localDir);

  return {
    success: true,
    data: {
      workflows: workflows.map(w => ({
        name: w.name,
        description: w.description,
        steps: w.steps.length,
      })),
    },
  };
}
