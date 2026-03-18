/**
 * Hook event watcher.
 * Manages event listeners for file-change and git hook triggers.
 * Uses chokidar for file-change watching.
 */

import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { loadHooksByTrigger } from "./loader.js";
import { executeHook } from "./executor.js";
import { logger } from "../../shared/logger.js";
import type { HookTrigger } from "../../shared/types.js";

/** Active chokidar watchers keyed by hook name. */
const fileWatchers = new Map<string, FSWatcher>();

/**
 * Start watching file patterns for a file-change hook.
 * @param hookName - Hook to activate.
 * @param patterns - Glob patterns to watch.
 * @param localDir - Optional local hooks directory.
 */
export function startFileWatcher(
  hookName: string,
  patterns: string[],
  localDir?: string
): void {
  if (fileWatchers.has(hookName)) return;

  const watcher = chokidar.watch(patterns, {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on("change", (filePath: string) => {
    logger.info("File change detected, firing hook", { hookName, filePath });
    executeHook(hookName, { changedFile: filePath }, localDir);
  });

  watcher.on("add", (filePath: string) => {
    logger.info("File added, firing hook", { hookName, filePath });
    executeHook(hookName, { changedFile: filePath }, localDir);
  });

  fileWatchers.set(hookName, watcher);
  logger.info("File watcher started", { hookName, patterns });
}

/**
 * Stop a file watcher for a hook.
 * @param hookName - Hook name.
 */
export async function stopFileWatcher(hookName: string): Promise<void> {
  const watcher = fileWatchers.get(hookName);
  if (watcher) {
    await watcher.close();
    fileWatchers.delete(hookName);
    logger.info("File watcher stopped", { hookName });
  }
}

/**
 * Stop all active file watchers.
 */
export async function stopAllWatchers(): Promise<void> {
  for (const [name, watcher] of fileWatchers) {
    await watcher.close();
    fileWatchers.delete(name);
  }
  logger.info("All file watchers stopped");
}

/**
 * Install git hooks for pre-commit/pre-push triggers.
 * Writes shell scripts to .git/hooks/ that call `clawforge hook trigger <name>`.
 * @param gitDir - Path to the git repository root.
 * @param localDir - Optional local hooks directory.
 */
export function installGitHooks(gitDir: string, localDir?: string): void {
  const gitHooksDir = path.join(gitDir, ".git", "hooks");
  if (!fs.existsSync(gitHooksDir)) {
    logger.warn("Git hooks directory not found", { gitHooksDir });
    return;
  }

  const triggerMap: Record<string, HookTrigger> = {
    "pre-commit": "pre-commit",
    "pre-push": "pre-push",
  };

  for (const [gitHook, trigger] of Object.entries(triggerMap)) {
    const hooks = loadHooksByTrigger(trigger, localDir);
    if (hooks.length === 0) continue;

    const hookScript = path.join(gitHooksDir, gitHook);
    const lines = ["#!/bin/sh"];
    for (const hook of hooks) {
      lines.push(`clawforge hook trigger "${hook.name}"`);
    }

    fs.writeFileSync(hookScript, lines.join("\n") + "\n", { mode: 0o755 });
    logger.info("Git hook installed", { gitHook, hookCount: hooks.length });
  }
}

/**
 * Activate all file-change hooks by starting their watchers.
 * @param localDir - Optional local hooks directory.
 */
export function activateFileChangeHooks(localDir?: string): void {
  const hooks = loadHooksByTrigger("file-change", localDir);

  for (const hook of hooks) {
    const patterns = hook.conditions["file_patterns"]
      ? hook.conditions["file_patterns"].split(",").map(p => p.trim())
      : ["**/*"];

    startFileWatcher(hook.name, patterns, localDir);
  }

  logger.info("File-change hooks activated", { count: hooks.length });
}

/**
 * Fire session lifecycle hooks.
 * @param trigger - "on-session-start" or "on-session-end".
 * @param context - Additional context to pass.
 * @param localDir - Optional local hooks directory.
 */
export function fireSessionHook(
  trigger: "on-session-start" | "on-session-end",
  context: Record<string, string> = {},
  localDir?: string
): void {
  const hooks = loadHooksByTrigger(trigger, localDir);
  for (const hook of hooks) {
    executeHook(hook.name, context, localDir);
  }
}

/**
 * Fire error hooks when a shell command exits with non-zero code.
 * @param exitCode - The shell command exit code.
 * @param command - The command that failed.
 * @param localDir - Optional local hooks directory.
 */
export function fireErrorHook(
  exitCode: number,
  command: string,
  localDir?: string
): void {
  if (exitCode === 0) return;
  const hooks = loadHooksByTrigger("on-error", localDir);
  for (const hook of hooks) {
    executeHook(hook.name, { exitCode: String(exitCode), command }, localDir);
  }
}
