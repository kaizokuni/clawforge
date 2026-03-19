/**
 * Real-time observation capture.
 * Records tool calls and events as observations in the vector store.
 */

import crypto from "node:crypto";
import { insertObservation } from "./vector-store.js";
import { logger } from "../../shared/logger.js";
import type { Observation } from "../../shared/types.js";
import { MONITOR_PORT } from "../../shared/constants.js";

/** Valid observation categories. */
export type ObservationType =
  | "file_read"
  | "file_write"
  | "shell_command"
  | "git_op"
  | "decision"
  | "bug_fix"
  | "feature"
  | "discovery";

/**
 * Capture an observation from a tool call or event.
 * Writes immediately to the observations table.
 * @param type - The category of the observation.
 * @param title - Short title describing the observation.
 * @param content - Full content/details.
 * @param sessionId - Current session identifier.
 * @param projectPath - Project directory path.
 * @returns The created observation.
 */
export function captureObservation(
  type: ObservationType,
  title: string,
  content: string,
  sessionId: string,
  projectPath: string
): Observation {
  const observation: Observation = {
    id: crypto.randomUUID(),
    sessionId,
    projectPath,
    toolName: title,
    input: "",
    output: content,
    timestamp: new Date().toISOString(),
    tags: [type],
  };

  try {
    insertObservation(observation);
    logger.debug("Observation captured", { id: observation.id, type, title });
    // Fire-and-forget: notify the daemon's SSE broadcast endpoint
    fetch(`http://localhost:${MONITOR_PORT}/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "observation", data: { id: observation.id, type, title, timestamp: observation.timestamp } }),
    }).catch(() => { /* daemon may not be running, silently ignore */ });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Failed to capture observation", { error: msg, type, title });
  }

  return observation;
}

/**
 * Capture a tool call as an observation.
 * Convenience wrapper that auto-categorizes based on tool name.
 * @param toolName - The name of the tool called.
 * @param input - Tool input (stringified).
 * @param output - Tool output (stringified).
 * @param sessionId - Current session ID.
 * @param projectPath - Project directory path.
 * @returns The created observation.
 */
export function captureToolCall(
  toolName: string,
  input: string,
  output: string,
  sessionId: string,
  projectPath: string
): Observation {
  const type = categorizeToolCall(toolName);
  const content = `Input: ${input}\nOutput: ${output}`;
  return captureObservation(type, toolName, content, sessionId, projectPath);
}

/**
 * Auto-categorize a tool call based on tool name.
 * @param toolName - The tool name.
 * @returns The observation category.
 */
function categorizeToolCall(toolName: string): ObservationType {
  if (toolName.includes("browser") || toolName.includes("web")) return "discovery";
  if (toolName.includes("git")) return "git_op";
  if (toolName.includes("file") || toolName.includes("read")) return "file_read";
  if (toolName.includes("write") || toolName.includes("edit")) return "file_write";
  if (toolName.includes("shell") || toolName.includes("exec")) return "shell_command";
  if (toolName.includes("debug") || toolName.includes("fix")) return "bug_fix";
  if (toolName.includes("test")) return "feature";
  return "discovery";
}
