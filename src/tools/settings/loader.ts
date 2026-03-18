/**
 * Settings presets loader.
 * Discovers .yaml files in ~/.clawforge/settings/ and ./settings/.
 * Parses: name, description, permissions (allowedTools, blockedTools, flags).
 */

import fs from "node:fs";
import path from "node:path";
import { parse as yamlParse } from "yaml";
import { SETTINGS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { SettingsPreset } from "../../shared/types.js";

/**
 * Load all settings presets from global and local directories.
 * @param localDir - Optional local settings directory (e.g. ./settings/).
 * @returns Array of SettingsPreset.
 */
export function loadPresets(localDir?: string): SettingsPreset[] {
  const dirs: string[] = [SETTINGS_DIR];
  if (localDir) dirs.push(localDir);

  const seen = new Set<string>();
  const presets: SettingsPreset[] = [];

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

        const perms = (data["permissions"] as Record<string, unknown>) ?? {};

        presets.push({
          name,
          description: (data["description"] as string) ?? "",
          permissions: {
            allowedTools: (perms["allowed_tools"] as string[]) ?? [],
            blockedTools: (perms["blocked_tools"] as string[]) ?? [],
            readOnly: Boolean(perms["read_only"] ?? false),
            allowShell: Boolean(perms["allow_shell"] ?? true),
            allowBrowser: Boolean(perms["allow_browser"] ?? true),
            allowNetwork: Boolean(perms["allow_network"] ?? true),
          },
        });
      } catch (err) {
        logger.warn("Failed to load settings preset", { file: filePath, error: String(err) });
      }
    }
  }

  logger.info("Settings presets loaded", { count: presets.length });
  return presets;
}

/**
 * Load a single preset by name.
 * @param name - Preset name.
 * @param localDir - Optional local settings directory.
 * @returns SettingsPreset or undefined.
 */
export function loadPreset(name: string, localDir?: string): SettingsPreset | undefined {
  return loadPresets(localDir).find(p => p.name === name);
}
