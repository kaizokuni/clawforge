/**
 * CLI: clawforge hook <action>
 * Hook management commands.
 */

import { Command } from "commander";
import { triggerHook, listHooks } from "../tools/hooks/executor.js";
import { scaffoldHook } from "../tools/hooks/scaffolder.js";
import { installGitHooks, activateFileChangeHooks } from "../tools/hooks/watcher.js";
import type { HookTrigger } from "../shared/types.js";

export function makeHookCommand(): Command {
  const cmd = new Command("hook").description("Hook management");

  cmd.command("trigger <name>")
    .description("Manually fire a hook by name")
    .option("--context <json>", "JSON context object")
    .action((name: string, opts: { context?: string }) => {
      try {
        const context = opts.context ? JSON.parse(opts.context) as Record<string, string> : {};
        const result = triggerHook(name, context);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all available hooks")
    .action(() => {
      try {
        const result = listHooks();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("create <name>")
    .description("Scaffold a new hook")
    .option("--trigger <type>", "Trigger type (pre-commit|post-edit|file-change|on-error|...)", "file-change")
    .option("--description <text>", "Hook description", "TODO: describe this hook")
    .action((name: string, opts: { trigger: string; description: string }) => {
      try {
        const result = scaffoldHook(name, opts.trigger as HookTrigger, opts.description);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("install-git")
    .description("Install git hooks (pre-commit, pre-push) into .git/hooks/")
    .option("--dir <path>", "Git repository root", ".")
    .action((opts: { dir: string }) => {
      try {
        installGitHooks(opts.dir);
        console.log("Git hooks installed.");
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("watch")
    .description("Start file-change hook watchers")
    .action(() => {
      try {
        activateFileChangeHooks();
        console.log("File watchers active. Press Ctrl+C to stop.");
        process.on("SIGINT", () => process.exit(0));
        setInterval(() => {}, 1000);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
