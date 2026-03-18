/**
 * Page content summarizer.
 * Call Claude API to summarize fetched page content into key points.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../../shared/logger.js";
import type { ToolResult } from "../../shared/types.js";

/**
 * Summarize page content using Claude.
 * @param content - The page text content.
 * @param title - The page title.
 * @param apiKey - Anthropic API key (defaults to env).
 * @returns Tool result with summary.
 */
export async function summarizePage(
  content: string,
  title: string,
  apiKey?: string
): Promise<ToolResult> {
  const key = apiKey ?? process.env["ANTHROPIC_API_KEY"];

  if (!key) {
    // Return truncated content as fallback
    return {
      success: true,
      data: {
        title,
        summary: content.slice(0, 2000),
        keyPoints: [],
        isFallback: true,
      },
    };
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Summarize this webpage in 3-5 key bullet points. Be concise and factual.\n\nTitle: ${title}\n\nContent:\n${content.slice(0, 8000)}`,
      }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";

    return {
      success: true,
      data: {
        title,
        summary: text,
        keyPoints: text.split("\n").filter(l => l.trim().startsWith("-") || l.trim().startsWith("•")),
        isFallback: false,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Summarization failed", { error: msg });
    return {
      success: true,
      data: {
        title,
        summary: content.slice(0, 2000),
        keyPoints: [],
        isFallback: true,
      },
    };
  }
}
