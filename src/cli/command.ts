/**
 * CLI: clawforge command <action>
 * Slash command management.
 */

import { Command } from "commander";
import { runCommand, listCommands } from "../tools/commands/executor.js";
import { scaffoldCommand } from "../tools/commands/scaffolder.js";

export function makeCommandCommand(): Command {
  const cmd = new Command("command").description("Slash command management");

  cmd.command("run <name>")
    .description("Execute a slash command by name")
    .option("--task <text>", "Task context")
    .action((name: string, opts: { task?: string }) => {
      try {
        const result = runCommand(name, opts.task ?? "");
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all available slash commands")
    .action(() => {
      try {
        const result = listCommands();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("create <name>")
    .description("Scaffold a new slash command")
    .option("--description <text>", "Command description", "TODO: describe this command")
    .option("--category <cat>", "Category", "general")
    .action((name: string, opts: { description: string; category: string }) => {
      try {
        const result = scaffoldCommand(name, opts.description, opts.category);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
