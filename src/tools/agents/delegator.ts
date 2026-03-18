/**
 * Agent delegator.
 * Match a task description to the best agent by name or description keywords.
 */

import { loadAgents } from "./loader.js";
import { logger } from "../../shared/logger.js";
import type { AgentDefinition } from "../../shared/types.js";

/**
 * Find the best agent for a given task.
 * Matches by exact name first, then by keyword overlap with description.
 * @param task - The task description or agent name.
 * @param localDir - Local agents directory.
 * @returns The best matching agent, or null if none found.
 */
export function delegateToAgent(task: string, localDir?: string): AgentDefinition | null {
  const agents = loadAgents(localDir);
  if (agents.length === 0) return null;

  const normalized = task.toLowerCase();

  // 1. Exact name match
  const byName = agents.find(a => a.name.toLowerCase() === normalized);
  if (byName) return byName;

  // 2. Name contains the query
  const byNameContains = agents.find(a => normalized.includes(a.name.toLowerCase()));
  if (byNameContains) return byNameContains;

  // 3. Score by keyword overlap with description
  const scored = agents.map(agent => {
    const descWords = agent.description.toLowerCase().split(/\W+/);
    const taskWords = normalized.split(/\W+/);
    const overlap = taskWords.filter(w => w.length > 3 && descWords.includes(w)).length;
    return { agent, score: overlap };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (best && best.score > 0) {
    logger.debug("Agent selected by keyword match", { agent: best.agent.name, score: best.score, task });
    return best.agent;
  }

  // 4. Fallback: first agent
  logger.debug("No agent matched, returning first available", { task });
  return agents[0] ?? null;
}
