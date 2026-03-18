/**
 * MCP tool registration.
 * Registers all 35+ ClawForge tools on the McpServer instance.
 * Each tool: name, description, zod schema, handler imported from handlers.ts.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as h from "./handlers.js";

/**
 * Register all ClawForge MCP tools on the server.
 * @param server - McpServer instance.
 */
export function registerAllTools(server: McpServer): void {

  // ── Browser (6) ────────────────────────────────────────────────────────────
  server.tool("browser_open",
    "Open a URL in the Playwright browser. Waits for the page to load.",
    { url: z.string().describe("URL to navigate to"),
      waitUntil: z.enum(["load","domcontentloaded","networkidle"]).optional().describe("Wait condition") },
    (args) => h.browserOpen(args));

  server.tool("browser_screenshot",
    "Take a screenshot of the current browser page. Returns the saved PNG file path.",
    { selector: z.string().optional().describe("Optional CSS selector to capture"),
      fullPage: z.boolean().optional().describe("Capture full page height") },
    (args) => h.browserScreenshot(args));

  server.tool("browser_click",
    "Click an element in the browser by CSS selector.",
    { selector: z.string().describe("CSS selector to click") },
    (args) => h.browserClick(args));

  server.tool("browser_type",
    "Type text into an input element in the browser.",
    { selector: z.string().describe("CSS selector of the input element"),
      text: z.string().describe("Text to type") },
    (args) => h.browserType(args));

  server.tool("browser_evaluate",
    "Execute JavaScript in the browser page context and return the result.",
    { script: z.string().describe("JavaScript code to evaluate") },
    (args) => h.browserEvaluate(args));

  server.tool("browser_content",
    "Extract readable text content from the current browser page using Mozilla Readability.",
    {},
    () => h.browserContent());

  // ── Memory (5) ─────────────────────────────────────────────────────────────
  server.tool("memory_search",
    "Search the persistent vector memory for relevant observations and summaries.",
    { query: z.string().describe("Search query"),
      limit: z.number().optional().describe("Max results to return (default 10)"),
      projectPath: z.string().optional().describe("Filter by project path") },
    (args) => h.memorySearch(args));

  server.tool("memory_timeline",
    "Get a timeline of memory observations around a specific entry (Layer 2 retrieval).",
    { observationId: z.string().describe("ID of the observation to center around") },
    (args) => h.memoryTimeline(args));

  server.tool("memory_get_observations",
    "Get full observation details by IDs (Layer 3 retrieval — full details, highest token cost).",
    { ids: z.array(z.string()).describe("Array of observation IDs to retrieve") },
    (args) => h.memoryGetObservations(args));

  server.tool("memory_store",
    "Manually store an observation in persistent memory.",
    { type: z.string().describe("Observation type (e.g. decision, discovery, bug_fix)"),
      title: z.string().describe("Short title for this observation"),
      content: z.string().describe("Full content to store"),
      projectPath: z.string().optional().describe("Project path context") },
    (args) => h.memoryStore(args));

  server.tool("memory_context",
    "Get recent memory context for injection into current session (Layer 1 — lightweight index).",
    { projectPath: z.string().optional().describe("Filter by project path"),
      limit: z.number().optional().describe("Max entries (default 10)") },
    (args) => h.memoryContext(args));

  // ── Search (2) ─────────────────────────────────────────────────────────────
  server.tool("web_search",
    "Search the web using DuckDuckGo and return title, URL, and snippet for each result.",
    { query: z.string().describe("Search query"),
      maxResults: z.number().optional().describe("Max results (default 10)") },
    (args) => h.webSearch(args));

  server.tool("web_fetch",
    "Fetch a web page and return its readable text content.",
    { url: z.string().describe("URL to fetch"),
      maxLength: z.number().optional().describe("Max characters to return") },
    (args) => h.webFetch(args));

  // ── Design (2) ─────────────────────────────────────────────────────────────
  server.tool("design_preview",
    "Render HTML/CSS in the browser and take a screenshot for visual inspection.",
    { html: z.string().describe("HTML content to render"),
      css: z.string().optional().describe("CSS styles to apply"),
      viewport: z.object({ width: z.number(), height: z.number() }).optional().describe("Viewport dimensions") },
    (args) => h.designPreview(args));

  server.tool("design_iterate",
    "Capture the current browser state for a design iteration cycle.",
    { returnBase64: z.boolean().optional().describe("Return screenshot as base64 instead of file path") },
    (args) => h.designIterate(args));

  // ── Project Index (2) ──────────────────────────────────────────────────────
  server.tool("index_project",
    "Scan and index a codebase for semantic search. Chunks files and stores embeddings.",
    { dirPath: z.string().describe("Directory to index"),
      force: z.boolean().optional().describe("Force re-index even if already indexed") },
    (args) => h.indexProject(args));

  server.tool("index_search",
    "Search the project index using semantic similarity.",
    { query: z.string().describe("Search query"),
      limit: z.number().optional().describe("Max results (default 10)"),
      dirPath: z.string().optional().describe("Filter results to a specific project") },
    (args) => h.indexSearch(args));

  // ── Agents (2) ─────────────────────────────────────────────────────────────
  server.tool("agent_delegate",
    "Delegate a task to a built-in specialist sub-agent. Automatically selects the best agent for the task.",
    { task: z.string().describe("Task description to delegate"),
      agentName: z.string().optional().describe("Specific agent name (omit to auto-select)") },
    (args) => h.agentDelegate(args));

  server.tool("agent_list",
    "List all available sub-agents and their capabilities.",
    {},
    () => h.agentList());

  // ── MCP Hub (2) ────────────────────────────────────────────────────────────
  server.tool("mcp_route",
    "Route a tool call to a connected child MCP server.",
    { serverName: z.string().describe("Target MCP server name"),
      toolName: z.string().describe("Tool name on that server"),
      params: z.record(z.unknown()).optional().describe("Tool parameters") },
    (args) => h.mcpRoute(args));

  server.tool("mcp_list_servers",
    "List all registered MCP hub servers and their connection status.",
    {},
    () => h.mcpListServers());

  // ── Monitor (2) ────────────────────────────────────────────────────────────
  server.tool("monitor_status",
    "Get the monitoring dashboard status: sessions, token usage, observation count.",
    {},
    () => h.monitorStatus());

  server.tool("monitor_cost",
    "Get cost breakdown by project and time period.",
    {},
    () => h.monitorCost());

  // ── Cron (3) ───────────────────────────────────────────────────────────────
  server.tool("cron_schedule",
    "Schedule a recurring task using a cron expression.",
    { name: z.string().describe("Task name"),
      schedule: z.string().describe("Cron expression (e.g. '0 9 * * *' for daily at 9am)"),
      command: z.string().describe("Shell command to run") },
    (args) => h.cronSchedule(args));

  server.tool("cron_list",
    "List all scheduled cron tasks.",
    {},
    () => h.cronList());

  server.tool("cron_remove",
    "Remove a scheduled cron task by ID.",
    { jobId: z.string().describe("Cron job ID to remove") },
    (args) => h.cronRemove(args));

  // ── Skills (3) ─────────────────────────────────────────────────────────────
  server.tool("skill_run",
    "Execute a skill by name or trigger phrase. Returns the skill's instruction prompt as context.",
    { nameOrInput: z.string().describe("Skill name or trigger phrase"),
      task: z.string().optional().describe("Current task to apply the skill to") },
    (args) => h.skillRun(args));

  server.tool("skill_list",
    "List all available skills and their trigger phrases.",
    {},
    () => h.skillList());

  server.tool("skill_install",
    "Install a skill from a local directory path containing SKILL.md.",
    { sourcePath: z.string().describe("Path to directory containing SKILL.md") },
    (args) => h.skillInstall(args));

  // ── Commands (2) ───────────────────────────────────────────────────────────
  server.tool("command_run",
    "Execute a slash command by name. Returns the command's instruction prompt as context.",
    { name: z.string().describe("Command name (with or without leading slash)"),
      task: z.string().optional().describe("Current task context") },
    (args) => h.commandRun(args));

  server.tool("command_list",
    "List all available slash commands.",
    {},
    () => h.commandList());

  // ── Hooks (2) ──────────────────────────────────────────────────────────────
  server.tool("hook_trigger",
    "Manually trigger a hook by name.",
    { name: z.string().describe("Hook name to trigger"),
      context: z.record(z.string()).optional().describe("Runtime context variables") },
    (args) => h.hookTrigger(args));

  server.tool("hook_list",
    "List all available hooks and their trigger conditions.",
    {},
    () => h.hookList());

  // ── Settings (2) ───────────────────────────────────────────────────────────
  server.tool("settings_apply",
    "Apply a settings preset to restrict or configure tool permissions.",
    { name: z.string().describe("Preset name (e.g. read-only, full-access, ci-mode)") },
    (args) => h.settingsApply(args));

  server.tool("settings_list",
    "List all available settings presets.",
    {},
    () => h.settingsList());

  // ── Marketplace (2) ────────────────────────────────────────────────────────
  server.tool("marketplace_search",
    "Search the component marketplace for agents, skills, commands, hooks, and more.",
    { query: z.string().optional().describe("Search query"),
      type: z.enum(["agent","skill","command","hook","setting","bundle","workflow","stack"]).optional().describe("Filter by component type") },
    (args) => h.marketplaceSearch(args));

  server.tool("marketplace_install",
    "Install a component from a local path or URL.",
    { source: z.string().describe("Local file path or HTTPS URL to install from") },
    (args) => h.marketplaceInstall(args));

  // ── Workflows (2) ──────────────────────────────────────────────────────────
  server.tool("workflow_run",
    "Execute a workflow by name. Runs steps in sequence, passing context between steps.",
    { name: z.string().describe("Workflow name to execute"),
      context: z.string().optional().describe("Initial context or input for the first step") },
    (args) => h.workflowRun(args));

  server.tool("workflow_list",
    "List all available workflows.",
    {},
    () => h.workflowList());
}
