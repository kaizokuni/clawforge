/**
 * CLI: clawforge agent <action>
 * Sub-agent management commands.
 */

import { Command } from "commander";
import { loadAgents } from "../tools/agents/loader.js";
import { runAgent } from "../tools/agents/runner.js";
import { scaffoldAgent } from "../tools/agents/scaffolder.js";

export function makeAgentCommand(): Command {
  const cmd = new Command("agent").description("Sub-agent management");

  cmd.command("list")
    .description("List all available agents")
    .action(() => {
      try {
        const agents = loadAgents();
        console.log(JSON.stringify(agents.map(a => ({ name: a.name, description: a.description, tools: a.tools })), null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("run <name> <task>")
    .description("Run an agent with a task (requires ANTHROPIC_API_KEY)")
    .action(async (name: string, task: string) => {
      try {
        const result = await runAgent(name, task, process.env["ANTHROPIC_API_KEY"]);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("create <name>")
    .description("Scaffold a new agent definition")
    .option("--description <text>", "Agent description", "TODO: describe this agent")
    .option("--tools <list>", "Comma-separated tool names")
    .action((name: string, opts: { description: string; tools?: string }) => {
      try {
        const tools = opts.tools ? opts.tools.split(",").map(t => t.trim()) : [];
        const result = scaffoldAgent(name, opts.description, tools);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
