/**
 * ClawForge CLI — Commander.js program.
 * Registers all subcommands and wires them to tool modules.
 */

import { Command } from "commander";
import { VERSION, APP_NAME } from "../shared/constants.js";
import { makeBrowserCommand } from "./browser.js";
import { makeMemoryCommand } from "./memory.js";
import { makeSearchCommand } from "./search.js";
import { makeDesignCommand } from "./design.js";
import { makeIndexCommand } from "./index-cmd.js";
import { makeCronCommand } from "./cron.js";
import { makeSkillCommand } from "./skill.js";
import { makeAgentCommand } from "./agent.js";
import { makeMcpCommand } from "./mcp.js";
import { makeMonitorCommand } from "./monitor.js";
import { makeCommandCommand } from "./command.js";
import { makeHookCommand } from "./hook.js";
import { makeSettingsCommand } from "./settings.js";
import { makeMarketplaceCommand } from "./marketplace.js";
import { makeWorkflowCommand } from "./workflow.js";
import { makeInitCommand } from "./init.js";
import { makeSetupCommand } from "./setup.js";
import { startDaemon, stopDaemon, daemonStatus } from "../daemon/service.js";

/**
 * Build and return the Commander CLI program.
 */
export function buildCli(): Command {
  const program = new Command()
    .name(APP_NAME)
    .description("Local MCP toolkit that extends Claude Code with 35 tools")
    .version(VERSION, "-v, --version");

  // Subcommand groups
  program.addCommand(makeBrowserCommand());
  program.addCommand(makeMemoryCommand());
  program.addCommand(makeSearchCommand());
  program.addCommand(makeDesignCommand());
  program.addCommand(makeIndexCommand());
  program.addCommand(makeCronCommand());
  program.addCommand(makeSkillCommand());
  program.addCommand(makeAgentCommand());
  program.addCommand(makeMcpCommand());
  program.addCommand(makeMonitorCommand());
  program.addCommand(makeCommandCommand());
  program.addCommand(makeHookCommand());
  program.addCommand(makeSettingsCommand());
  program.addCommand(makeMarketplaceCommand());
  program.addCommand(makeWorkflowCommand());
  program.addCommand(makeInitCommand());
  program.addCommand(makeSetupCommand());

  // Daemon lifecycle
  program.command("start")
    .description("Start the ClawForge daemon in the background")
    .action(() => {
      try {
        const pid = startDaemon();
        console.log(`Daemon started (PID: ${pid})`);
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  program.command("stop")
    .description("Stop the running daemon")
    .action(() => {
      try {
        stopDaemon();
        console.log("Daemon stopped.");
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  program.command("status")
    .description("Check daemon status")
    .action(() => {
      try {
        console.log(JSON.stringify(daemonStatus(), null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return program;
}
