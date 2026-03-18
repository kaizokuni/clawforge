/**
 * Marketplace publisher.
 * Packages a local component, adds metadata, appends to registry.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse as yamlParse } from "yaml";
import { loadRegistry, saveRegistry } from "./registry.js";
import { validateComponent } from "./validator.js";
import { logger } from "../../shared/logger.js";
import type { ComponentType, MarketplaceEntry, ToolResult } from "../../shared/types.js";

/**
 * Publish a local component to the registry.
 * @param filePath - Path to the component file.
 * @param author - Author name or GitHub handle.
 * @param type - Override component type detection.
 * @returns Tool result with the published entry.
 */
export function publishComponent(
  filePath: string,
  author: string,
  type?: ComponentType
): ToolResult {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }

  // Security check first
  const validation = validateComponent(filePath);
  if (!validation.success) {
    return validation;
  }

  // Parse metadata from the file
  let name = "";
  let description = "";
  let version = "1.0.0";
  let tags: string[] = [];
  let detectedType: ComponentType | undefined = type;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".md") {
      const { data } = matter(raw);
      name = (data["name"] as string) ?? path.basename(filePath, ".md");
      description = (data["description"] as string) ?? "";
      version = (data["version"] as string) ?? "1.0.0";
      tags = (data["tags"] as string[]) ?? [];

      if (!detectedType) {
        if (data["trigger"]) detectedType = "hook";
        else if (data["tools_used"] || data["triggers"]) detectedType = "skill";
        else if (data["tools"] || data["model"]) detectedType = "agent";
        else detectedType = "command";
      }
    } else if (ext === ".yaml" || ext === ".yml") {
      const data = yamlParse(raw) as Record<string, unknown>;
      name = (data["name"] as string) ?? path.basename(filePath, ext);
      description = (data["description"] as string) ?? "";
      version = (data["version"] as string) ?? "1.0.0";
      tags = (data["tags"] as string[]) ?? [];

      if (!detectedType) {
        if (data["permissions"]) detectedType = "setting";
        else if (data["steps"]) detectedType = "workflow";
        else if (data["components"]) detectedType = "bundle";
        else detectedType = "stack";
      }
    }
  } catch (err) {
    return { success: false, error: `Failed to parse component: ${String(err)}` };
  }

  if (!name) {
    return { success: false, error: "Component has no name" };
  }
  if (!detectedType) {
    return { success: false, error: "Cannot detect component type" };
  }

  const entry: MarketplaceEntry = {
    name,
    type: detectedType,
    description,
    version,
    author,
    downloads: 0,
    tags,
  };

  // Add or update in registry
  const entries = loadRegistry();
  const existing = entries.findIndex(e => e.name === name && e.type === detectedType);

  if (existing >= 0) {
    entries[existing] = { ...entries[existing]!, ...entry };
    logger.info("Component updated in registry", { name, type: detectedType });
  } else {
    entries.push(entry);
    logger.info("Component published to registry", { name, type: detectedType });
  }

  saveRegistry(entries);

  return {
    success: true,
    data: { entry },
  };
}
