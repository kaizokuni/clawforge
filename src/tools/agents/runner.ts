/**
 * Agent runner.
 * Execute an agent: build system prompt from .md body, call Claude API,
 * restrict tool descriptions to agent's allowed tools list.
 */

import Anthropic from "@anthropic-ai/sdk";
import { delegateToAgent } from "./delegator.js";
import { logger } from "../../shared/logger.js";
import type { AgentDefinition, ToolResult } from "../../shared/types.js";

/** All available tool names (used to filter per-agent). */
const ALL_TOOLS = [
  "browser_open", "browser_screenshot", "browser_click", "browser_type",
  "browser_evaluate", "browser_content", "memory_search", "memory_timeline",
  "memory_get_observations", "memory_store", "memory_status", "web_search",
  "web_fetch", "design_preview", "design_iterate", "index_project",
  "index_search", "agent_delegate", "agent_list", "mcp_route",
  "mcp_list_servers", "monitor_status", "monitor_cost", "cron_schedule",
  "cron_list", "cron_remove", "skill_run", "skill_list", "skill_install",
  "command_run", "command_list", "hook_trigger", "hook_list",
  "settings_apply", "settings_list", "marketplace_search", "marketplace_install",
  "workflow_run", "workflow_list",
];

/**
 * Run an agent with a given task.
 * @param agentNameOrDef - Agent name string or a pre-loaded AgentDefinition.
 * @param task - The task to give the agent.
 * @param apiKey - Anthropic API key (defaults to env).
 * @param localDir - Local agents directory.
 * @returns Tool result with the agent's response.
 */
export async function runAgent(
  agentNameOrDef: string | AgentDefinition,
  task: string,
  apiKey?: string,
  localDir?: string
): Promise<ToolResult> {
  const key = apiKey ?? process.env["ANTHROPIC_API_KEY"];
  if (!key) {
    return { success: false, error: "ANTHROPIC_API_KEY not set" };
  }

  // Resolve agent definition
  const agent: AgentDefinition | null =
    typeof agentNameOrDef === "string"
      ? delegateToAgent(agentNameOrDef, localDir)
      : agentNameOrDef;

  if (!agent) {
    return { success: false, error: `No agent found for: ${agentNameOrDef}` };
  }

  // Determine allowed tools — intersection of agent's list and all available
  const allowedTools = agent.tools.length > 0
    ? agent.tools.filter(t => ALL_TOOLS.includes(t))
    : ALL_TOOLS;

  // Build system prompt
  const systemPrompt = [
    agent.systemPrompt,
    `\n\n## Available Tools\nYou have access to these tools only: ${allowedTools.join(", ")}`,
  ].join("\n");

  logger.info("Running agent", { name: agent.name, allowedTools: allowedTools.length, task: task.slice(0, 80) });

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: agent.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: task }],
    });

    const text = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("\n");

    return {
      success: true,
      data: {
        agent: agent.name,
        response: text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Agent run failed", { agent: agent.name, error: msg });
    return { success: false, error: `Agent execution failed: ${msg}` };
  }
}

/**
 * List all available agents.
 * @param localDir - Local agents directory.
 * @returns Tool result with agents list.
 */
export function listAgents(localDir?: string): ToolResult {
  const { loadAgents } = require("./loader.js") as typeof import("./loader.js");
  const agents = loadAgents(localDir);
  return {
    success: true,
    data: {
      agents: agents.map(a => ({
        name: a.name,
        description: a.description,
        tools: a.tools,
        model: a.model,
      })),
    },
  };
}
