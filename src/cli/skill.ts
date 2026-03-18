/**
 * CLI: clawforge skill <action>
 * Skills management commands.
 */

import { Command } from "commander";
import { runSkill, listSkills, installSkill } from "../tools/skills/executor.js";
import { scaffoldAgent } from "../tools/agents/scaffolder.js";

export function makeSkillCommand(): Command {
  const cmd = new Command("skill").description("Skills management (Antigravity-compatible)");

  cmd.command("run <name>")
    .description("Execute a skill by name or trigger phrase")
    .option("--task <text>", "Task context to pass to the skill")
    .action((name: string, opts: { task?: string }) => {
      try {
        const result = runSkill(name, opts.task ?? "");
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all available skills")
    .action(() => {
      try {
        const result = listSkills();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("install <path>")
    .description("Install a skill from a directory containing SKILL.md")
    .action((skillPath: string) => {
      try {
        const result = installSkill(skillPath);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
