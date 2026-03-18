/**
 * Text → vector embedding.
 * Tries Ollama nomic-embed-text first, falls back to OpenAI text-embedding-3-small.
 */

import { Ollama } from "ollama";
import { logger } from "../../shared/logger.js";
import { EMBEDDING_DIMENSIONS } from "../../shared/constants.js";

let ollamaClient: Ollama | null = null;

/**
 * Get or create the Ollama client.
 * @param host - Ollama server host URL.
 * @returns Ollama client instance.
 */
function getOllamaClient(host: string = "http://localhost:11434"): Ollama {
  if (!ollamaClient) {
    ollamaClient = new Ollama({ host });
  }
  return ollamaClient;
}

/**
 * Embed text using Ollama nomic-embed-text.
 * @param text - The text to embed.
 * @param host - Ollama host URL.
 * @returns The embedding vector.
 */
async function embedWithOllama(text: string, host?: string): Promise<number[]> {
  const client = getOllamaClient(host);
  const response = await client.embed({
    model: "nomic-embed-text",
    input: text,
  });
  return response.embeddings[0] as number[];
}

/**
 * Embed text using OpenAI text-embedding-3-small.
 * @param text - The text to embed.
 * @param apiKey - OpenAI API key.
 * @returns The embedding vector.
 */
async function embedWithOpenAI(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0]!.embedding;
}

/**
 * Embed text into a vector. Tries Ollama first, falls back to OpenAI.
 * @param text - The text to embed.
 * @param options - Optional configuration for host/API keys.
 * @returns The embedding vector as number[].
 */
export async function embed(text: string, options?: {
  ollamaHost?: string;
  openaiApiKey?: string;
}): Promise<number[]> {
  // Try Ollama first
  try {
    const vector = await embedWithOllama(text, options?.ollamaHost);
    return vector;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.debug("Ollama embedding failed, trying fallback", { error: msg });
  }

  // Fallback to OpenAI
  const apiKey = options?.openaiApiKey ?? process.env["OPENAI_API_KEY"];
  if (apiKey) {
    try {
      const vector = await embedWithOpenAI(text, apiKey);
      return vector;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("OpenAI embedding also failed", { error: msg });
    }
  }

  // Last resort: return zero vector (allows system to function without embeddings)
  logger.warn("No embedding provider available, returning zero vector");
  return new Array(EMBEDDING_DIMENSIONS).fill(0);
}
