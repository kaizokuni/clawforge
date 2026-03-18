/**
 * CLI: clawforge mcp <action>
 * MCP integration hub management.
 */

import { Command } from "commander";
import { listServers } from "../tools/mcp-hub/router.js";
import { registerServer } from "../tools/mcp-hub/registry.js";
import { discoverServerTools } from "../tools/mcp-hub/discovery.js";

export function makeMcpCommand(): Command {
  const cmd = new Command("mcp").description("MCP integration hub");

  cmd.command("list")
    .description("List registered MCP servers")
    .action(() => {
      try {
        const servers = listServers();
        console.log(JSON.stringify(servers, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("add <name> <command>")
    .description("Register a new MCP server")
    .option("--args <args>", "Space-separated arguments")
    .action((name: string, command: string, opts: { args?: string }) => {
      try {
        const args = opts.args ? opts.args.split(" ") : [];
        registerServer({ name, command, args, env: {} });
        const result = { success: true, data: { name } };
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("discover <name> <command>")
    .description("Connect to a server and discover its tools")
    .option("--args <args>", "Space-separated arguments")
    .action(async (name: string, command: string, opts: { args?: string }) => {
      try {
        const args = opts.args ? opts.args.split(" ") : [];
        const tools = await discoverServerTools(name, command, args);
        console.log(JSON.stringify(tools, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
