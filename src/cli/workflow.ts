/**
 * CLI: clawforge workflow <action>
 * Workflow management commands.
 */

import { Command } from "commander";
import { runWorkflow, listWorkflows } from "../tools/workflows/runner.js";
import { scaffoldWorkflow } from "../tools/workflows/scaffolder.js";

export function makeWorkflowCommand(): Command {
  const cmd = new Command("workflow").description("Workflow management");

  cmd.command("run <name>")
    .description("Execute a workflow by name")
    .option("--context <text>", "Initial context for the first step")
    .action(async (name: string, opts: { context?: string }) => {
      try {
        const result = await runWorkflow(name, opts.context ?? "", process.env["ANTHROPIC_API_KEY"]);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all available workflows")
    .action(() => {
      try {
        const result = listWorkflows();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("create <name>")
    .description("Scaffold a new workflow definition")
    .option("--description <text>", "Workflow description", "TODO: describe this workflow")
    .action((name: string, opts: { description: string }) => {
      try {
        const result = scaffoldWorkflow(name, opts.description);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
