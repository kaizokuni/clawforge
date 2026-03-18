/**
 * Configuration loader.
 * Reads ~/.clawforge/config.yaml, validates with zod, applies defaults.
 */

import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { CONFIG_PATH, CLAWFORGE_HOME, REQUIRED_DIRS } from "./constants.js";
import { ConfigSchema } from "./types.js";
import type { Config } from "./types.js";
import { logger } from "./logger.js";

/**
 * Ensure all required ClawForge directories exist.
 * Creates them recursively if missing.
 */
export function ensureDirectories(): void {
  for (const dir of REQUIRED_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load the ClawForge configuration from disk.
 * If the file does not exist, creates it with defaults.
 * If the file is invalid, returns defaults and logs a warning.
 * @returns The validated configuration object.
 */
export function loadConfig(): Config {
  ensureDirectories();

  if (!fs.existsSync(CONFIG_PATH)) {
    const defaults = ConfigSchema.parse({});
    writeConfig(defaults);
    logger.info("Created default config", { path: CONFIG_PATH });
    return defaults;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed: unknown = parseYaml(raw);
    const config = ConfigSchema.parse(parsed);
    return config;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("Invalid config file, using defaults", { error: message, path: CONFIG_PATH });
    return ConfigSchema.parse({});
  }
}

/**
 * Write a configuration object to disk as YAML.
 * @param config - The configuration to persist.
 */
export function writeConfig(config: Config): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  const yamlStr = stringifyYaml(config);
  fs.writeFileSync(CONFIG_PATH, yamlStr, "utf-8");
}

/**
 * Merge partial updates into the current config and persist.
 * @param updates - Partial config values to merge.
 * @returns The updated full configuration.
 */
export function updateConfig(updates: Partial<Config>): Config {
  const current = loadConfig();
  const merged = { ...current, ...updates };
  const validated = ConfigSchema.parse(merged);
  writeConfig(validated);
  return validated;
}

/**
 * Get the path to a user-level ClawForge directory.
 * @param subdir - The subdirectory name (e.g., "agents", "skills").
 * @returns Absolute path to that directory under CLAWFORGE_HOME.
 */
export function getUserDir(subdir: string): string {
  return path.join(CLAWFORGE_HOME, subdir);
}
