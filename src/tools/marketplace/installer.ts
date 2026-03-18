/**
 * Marketplace installer.
 * Downloads a component from URL or local path.
 * Detects type by examining file content, copies to correct ~/.clawforge/<type>/ dir.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse as yamlParse } from "yaml";
import {
  AGENTS_DIR, SKILLS_DIR, COMMANDS_DIR, HOOKS_DIR, SETTINGS_DIR,
} from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import { validateComponent } from "./validator.js";
import type { ComponentType, ToolResult } from "../../shared/types.js";

const TYPE_DIRS: Record<string, string> = {
  agent: AGENTS_DIR,
  skill: SKILLS_DIR,
  command: COMMANDS_DIR,
  hook: HOOKS_DIR,
  setting: SETTINGS_DIR,
};

/**
 * Detect component type from file content.
 * @param filePath - Path to the component file.
 * @returns Detected type or undefined.
 */
function detectType(filePath: string): ComponentType | undefined {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // SKILL.md — skill
  if (basename === "SKILL.md") return "skill";

  // .yaml/.yml — check for permissions key → setting; else could be workflow/stack/bundle
  if (ext === ".yaml" || ext === ".yml") {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = yamlParse(raw) as Record<string, unknown>;
      if (data["permissions"]) return "setting";
      if (data["steps"]) return "workflow";
      if (data["components"]) return "bundle";
      if (data["agents"] || data["skills"]) return "stack";
    } catch { /* fallthrough */ }
    return "setting";
  }

  // .md — check frontmatter
  if (ext === ".md") {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      if (data["trigger"]) return "hook";
      if (data["tools_used"] || data["triggers"]) return "skill";
      if (data["tools"] || data["model"]) return "agent";
      if (data["category"]) return "command";
    } catch { /* fallthrough */ }
    return "command";
  }

  return undefined;
}

/**
 * Install a component from a local path.
 * @param sourcePath - Path to the component file or directory.
 * @param forceType - Override auto-detected type.
 * @returns Tool result.
 */
export function installFromPath(sourcePath: string, forceType?: ComponentType): ToolResult {
  if (!fs.existsSync(sourcePath)) {
    return { success: false, error: `Source not found: ${sourcePath}` };
  }

  // Resolve skill directory (contains SKILL.md)
  let filePath = sourcePath;
  const stat = fs.statSync(sourcePath);
  if (stat.isDirectory()) {
    const skillMd = path.join(sourcePath, "SKILL.md");
    if (fs.existsSync(skillMd)) {
      filePath = skillMd;
    } else {
      return { success: false, error: `Directory has no SKILL.md: ${sourcePath}` };
    }
  }

  // Security validation
  const validation = validateComponent(filePath);
  if (!validation.success) {
    return validation;
  }

  const type = forceType ?? detectType(filePath);
  if (!type || !TYPE_DIRS[type]) {
    return { success: false, error: `Cannot detect component type for: ${filePath}` };
  }

  const destDir = TYPE_DIRS[type]!;
  const destName = path.basename(filePath);
  const destPath = path.join(destDir, destName);

  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(filePath, destPath);
    logger.info("Component installed", { type, name: destName, dest: destPath });
    return { success: true, data: { type, name: destName, path: destPath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Install failed: ${msg}` };
  }
}

/**
 * Install a component from a URL.
 * Downloads to a temp file, then delegates to installFromPath.
 * @param url - HTTP/HTTPS URL to download from.
 * @param forceType - Override auto-detected type.
 * @returns Tool result.
 */
export async function installFromUrl(url: string, forceType?: ComponentType): Promise<ToolResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const content = await response.text();
    const filename = path.basename(new URL(url).pathname) || "component.md";
    const tmpPath = path.join(process.env["TEMP"] ?? "/tmp", `clawforge-install-${Date.now()}-${filename}`);

    fs.writeFileSync(tmpPath, content, "utf-8");

    const result = installFromPath(tmpPath, forceType);

    // Cleanup temp file
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Download failed: ${msg}` };
  }
}
