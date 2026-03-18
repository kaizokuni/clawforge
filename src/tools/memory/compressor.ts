/**
 * Batch-compress observations via LLM.
 * Takes N observations → calls Claude API → returns compressed summary.
 */

import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";
import { logger } from "../../shared/logger.js";
import type { Observation, Summary } from "../../shared/types.js";

/**
 * Compress a batch of observations into a single summary using Claude.
 * Achieves ~10x token reduction.
 * @param observations - Array of observations to compress.
 * @param apiKey - Anthropic API key (defaults to env var).
 * @returns A compressed summary.
 */
export async function compressObservations(
  observations: Observation[],
  apiKey?: string
): Promise<Summary> {
  const key = apiKey ?? process.env["ANTHROPIC_API_KEY"];

  if (!key) {
    logger.warn("No Anthropic API key, creating raw summary without LLM compression");
    return createFallbackSummary(observations);
  }

  const client = new Anthropic({ apiKey: key });

  const observationText = observations.map((obs, i) =>
    `[${i + 1}] ${obs.timestamp} | ${obs.toolName} (${obs.tags.join(", ")})\n${obs.output}`
  ).join("\n\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Compress these ${observations.length} tool observations into a concise summary. Include: key topics, decisions made, files touched, and action items. Be brief but preserve all important facts.\n\n${observationText}`,
      }],
    });

    const content = response.content[0];
    const text = content?.type === "text" ? content.text : "";

    return {
      id: crypto.randomUUID(),
      sessionId: observations[0]?.sessionId ?? "",
      projectPath: observations[0]?.projectPath ?? "",
      content: text,
      observationIds: observations.map(o => o.id),
      timestamp: new Date().toISOString(),
      tokenCount: text.length / 4, // rough estimate
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("LLM compression failed, using fallback", { error: msg });
    return createFallbackSummary(observations);
  }
}

/**
 * Create a summary without LLM compression.
 * Concatenates observation titles as a basic summary.
 * @param observations - The observations to summarize.
 * @returns A basic summary.
 */
function createFallbackSummary(observations: Observation[]): Summary {
  const content = observations.map(o =>
    `- ${o.toolName}: ${o.output.slice(0, 100)}`
  ).join("\n");

  return {
    id: crypto.randomUUID(),
    sessionId: observations[0]?.sessionId ?? "",
    projectPath: observations[0]?.projectPath ?? "",
    content,
    observationIds: observations.map(o => o.id),
    timestamp: new Date().toISOString(),
    tokenCount: content.length / 4,
  };
}
