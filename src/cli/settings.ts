/**
 * CLI: clawforge settings <action>
 * Settings preset management.
 */

import { Command } from "commander";
import { applyPreset, clearPreset, getActivePreset, getPresetStatus } from "../tools/settings/applier.js";
import { loadPresets } from "../tools/settings/loader.js";
import { validatePreset } from "../tools/settings/validator.js";

export function makeSettingsCommand(): Command {
  const cmd = new Command("settings").description("Settings preset management");

  cmd.command("apply <name>")
    .description("Apply a settings preset (e.g. read-only, full-access, ci-mode)")
    .action((name: string) => {
      try {
        const result = applyPreset(name);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("list")
    .description("List all available settings presets")
    .action(() => {
      try {
        const presets = loadPresets();
        console.log(JSON.stringify(presets.map(p => ({ name: p.name, description: p.description })), null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("status")
    .description("Show currently active preset")
    .action(() => {
      try {
        const status = getPresetStatus();
        console.log(JSON.stringify(status, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("clear")
    .description("Clear the active preset (restore full permissions)")
    .action(() => {
      try {
        const result = clearPreset();
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  cmd.command("validate <name>")
    .description("Validate a preset for unknown tool names")
    .action((name: string) => {
      try {
        const result = validatePreset(name);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) { console.error(String(e)); process.exit(1); }
    });

  return cmd;
}
