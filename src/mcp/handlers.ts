/**
 * MCP tool handlers.
 * Routes each tool call to the correct tool module function.
 * All handlers return MCP CallToolResult format: { content: [{ type, text }] }
 * Never throws — always returns structured errors.
 */

// ── Browser ─────────────────────────────────────────────────────────────────
import { navigate, getActivePage } from "../tools/browser/actions.js";
import { screenshot, content as browserGetContent } from "../tools/browser/capture.js";
import { click, type as typeText } from "../tools/browser/actions.js";

// ── Memory ───────────────────────────────────────────────────────────────────
import { search as memSearch, timeline as memTimeline, getFullObservations } from "../tools/memory/retriever.js";
import { captureObservation } from "../tools/memory/observer.js";
import type { ObservationType } from "../tools/memory/observer.js";
import { getRecentContext, formatContextForInjection } from "../tools/memory/injector.js";

// ── Search ───────────────────────────────────────────────────────────────────
import { searchDuckDuckGo } from "../tools/search/engine.js";
import { fetchPage } from "../tools/search/fetcher.js";

// ── Design ───────────────────────────────────────────────────────────────────
import { previewDesign } from "../tools/design/previewer.js";
import { captureForIteration } from "../tools/design/iterator.js";

// ── Indexer ──────────────────────────────────────────────────────────────────
import { indexProject as doIndexProject, searchIndex } from "../tools/indexer/search.js";

// ── Agents ───────────────────────────────────────────────────────────────────
import { delegateToAgent } from "../tools/agents/delegator.js";
import { runAgent } from "../tools/agents/runner.js";
import { loadAgents } from "../tools/agents/loader.js";

// ── MCP Hub ──────────────────────────────────────────────────────────────────
import { routeToolCall, listServers as mcpListServersInternal } from "../tools/mcp-hub/router.js";

// ── Monitor ──────────────────────────────────────────────────────────────────
import { getRecentSessions, getCostBreakdown, recordUsage } from "../tools/monitor/tracker.js";
import { getCurrentSession, estimateTokens } from "../tools/monitor/session.js";
import { getDb } from "../tools/memory/vector-store.js";

// ── Cron ─────────────────────────────────────────────────────────────────────
import { scheduleJob, removeJob, listJobs } from "../tools/cron/scheduler.js";

// ── Skills ───────────────────────────────────────────────────────────────────
import { runSkill, listSkills as doListSkills, installSkill } from "../tools/skills/executor.js";

// ── Commands ─────────────────────────────────────────────────────────────────
import { runCommand, listCommands } from "../tools/commands/executor.js";

// ── Hooks ────────────────────────────────────────────────────────────────────
import { triggerHook, listHooks } from "../tools/hooks/executor.js";

// ── Settings ─────────────────────────────────────────────────────────────────
import { applyPreset } from "../tools/settings/applier.js";
import { loadPresets } from "../tools/settings/loader.js";

// ── Marketplace ──────────────────────────────────────────────────────────────
import { searchMarketplace } from "../tools/marketplace/searcher.js";
import { installFromPath, installFromUrl } from "../tools/marketplace/installer.js";
import { loadRegistry, refreshRegistry } from "../tools/marketplace/registry.js";

// ── Workflows ────────────────────────────────────────────────────────────────
import { runWorkflow, listWorkflows } from "../tools/workflows/runner.js";

// ── MCP result helper ────────────────────────────────────────────────────────
type McpResult = { content: Array<{ type: "text"; text: string }> };

function ok(data: unknown): McpResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(message: string): McpResult {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }] };
}

function trackUsage(inputJson: string, resultText: string): void {
  const sid = getCurrentSession();
  if (!sid) return;
  recordUsage(sid, estimateTokens(inputJson), estimateTokens(resultText));
}

function wrap(fn: () => unknown, inputJson = ""): McpResult {
  try {
    const result = fn();
    const out = ok(result);
    trackUsage(inputJson, out.content[0]?.text ?? "");
    return out;
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

async function wrapAsync(fn: () => Promise<unknown>, inputJson = ""): Promise<McpResult> {
  try {
    const result = await fn();
    const out = ok(result);
    trackUsage(inputJson, out.content[0]?.text ?? "");
    return out;
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

// ── Browser handlers ────────────────────────────────────────────────────────
export async function browserOpen(args: { url: string; waitUntil?: "load" | "domcontentloaded" | "networkidle" }): Promise<McpResult> {
  return wrapAsync(() => navigate(args.url, args.waitUntil), JSON.stringify(args));
}

export async function browserScreenshot(args: { selector?: string; fullPage?: boolean }): Promise<McpResult> {
  return wrapAsync(() => screenshot(args), JSON.stringify(args));
}

export async function browserClick(args: { selector: string }): Promise<McpResult> {
  return wrapAsync(() => click(args.selector), JSON.stringify(args));
}

export async function browserType(args: { selector: string; text: string }): Promise<McpResult> {
  return wrapAsync(() => typeText(args.selector, args.text), JSON.stringify(args));
}

export async function browserEvaluate(args: { script: string }): Promise<McpResult> {
  return wrapAsync(async () => {
    const page = await getActivePage();
    const result = await page.evaluate(args.script);
    return { result };
  }, JSON.stringify(args));
}

export async function browserContent(): Promise<McpResult> {
  return wrapAsync(() => browserGetContent(), "{}");
}

// ── Memory handlers ─────────────────────────────────────────────────────────
export async function memorySearch(args: { query: string; limit?: number; projectPath?: string }): Promise<McpResult> {
  return wrapAsync(() => memSearch(args.query, args.limit ?? 10), JSON.stringify(args));
}

export function memoryTimeline(args: { observationId: string }): McpResult {
  return wrap(() => memTimeline(args.observationId), JSON.stringify(args));
}

export function memoryGetObservations(args: { ids: string[] }): McpResult {
  return wrap(() => getFullObservations(args.ids), JSON.stringify(args));
}

export async function memoryStore(args: { type: string; title: string; content: string; projectPath?: string }): Promise<McpResult> {
  return wrapAsync(async () => {
    const validTypes: ObservationType[] = ["file_read","file_write","shell_command","git_op","decision","bug_fix","feature","discovery"];
    const obsType = validTypes.includes(args.type as ObservationType) ? (args.type as ObservationType) : "decision";
    captureObservation(obsType, args.title, args.content, crypto.randomUUID(), args.projectPath ?? process.cwd());
    return { stored: true, title: args.title };
  }, JSON.stringify(args));
}

export function memoryContext(args: { projectPath?: string; limit?: number }): McpResult {
  return wrap(() => {
    const entries = getRecentContext(args.limit ?? 10, args.projectPath);
    return { context: formatContextForInjection(entries) };
  }, JSON.stringify(args));
}

// ── Search handlers ─────────────────────────────────────────────────────────
export async function webSearch(args: { query: string; maxResults?: number }): Promise<McpResult> {
  return wrapAsync(() => searchDuckDuckGo(args.query, args.maxResults ?? 10), JSON.stringify(args));
}

export async function webFetch(args: { url: string; maxLength?: number }): Promise<McpResult> {
  return wrapAsync(() => fetchPage(args.url, args.maxLength), JSON.stringify(args));
}

// ── Design handlers ─────────────────────────────────────────────────────────
export async function designPreview(args: { html: string; css?: string; viewport?: { width: number; height: number } }): Promise<McpResult> {
  return wrapAsync(() => previewDesign(args.html, args.css, args.viewport), JSON.stringify(args));
}

export async function designIterate(args: { returnBase64?: boolean }): Promise<McpResult> {
  return wrapAsync(() => captureForIteration(args.returnBase64), JSON.stringify(args));
}

// ── Indexer handlers ─────────────────────────────────────────────────────────
export async function indexProject(args: { dirPath: string; force?: boolean }): Promise<McpResult> {
  return wrapAsync(() => doIndexProject(args.dirPath), JSON.stringify(args));
}

export async function indexSearch(args: { query: string; limit?: number; dirPath?: string }): Promise<McpResult> {
  return wrapAsync(() => searchIndex(args.query, args.limit ?? 10), JSON.stringify(args));
}

// ── Agent handlers ───────────────────────────────────────────────────────────
export async function agentDelegate(args: { task: string; agentName?: string }): Promise<McpResult> {
  return wrapAsync(async () => {
    const agentName = args.agentName ?? delegateToAgent(args.task);
    if (!agentName) return { error: "No suitable agent found" };
    return runAgent(agentName, args.task, undefined);
  }, JSON.stringify(args));
}

export function agentList(): McpResult {
  return wrap(() => loadAgents().map(a => ({ name: a.name, description: a.description, tools: a.tools })), "{}");
}

// ── MCP Hub handlers ─────────────────────────────────────────────────────────
export async function mcpRoute(args: { serverName: string; toolName: string; params?: Record<string, unknown> }): Promise<McpResult> {
  return wrapAsync(() => routeToolCall(args.serverName, args.toolName, args.params ?? {}), JSON.stringify(args));
}

export function mcpListServers(): McpResult {
  return wrap(() => mcpListServersInternal(), "{}");
}

// ── Monitor handlers ──────────────────────────────────────────────────────────
export function monitorStatus(): McpResult {
  return wrap(() => {
    const sessions = getRecentSessions(10);
    const db = getDb();
    const obsCount = (db.prepare(`SELECT COUNT(*) as c FROM observations`).get() as { c: number }).c;
    return { sessions: (sessions.data as { sessions: unknown[] }).sessions, observationCount: obsCount };
  }, "{}");
}

export function monitorCost(): McpResult {
  return wrap(() => getCostBreakdown().data, "{}");
}

// ── Cron handlers ─────────────────────────────────────────────────────────────
export function cronSchedule(args: { name: string; schedule: string; command: string }): McpResult {
  return wrap(() => scheduleJob(args.name, args.schedule, args.command), JSON.stringify(args));
}

export function cronList(): McpResult {
  return wrap(() => listJobs(), "{}");
}

export function cronRemove(args: { jobId: string }): McpResult {
  return wrap(() => removeJob(args.jobId), JSON.stringify(args));
}

// ── Skill handlers ────────────────────────────────────────────────────────────
export function skillRun(args: { nameOrInput: string; task?: string }): McpResult {
  return wrap(() => runSkill(args.nameOrInput, args.task ?? ""), JSON.stringify(args));
}

export function skillList(): McpResult {
  return wrap(() => doListSkills(), "{}");
}

export function skillInstall(args: { sourcePath: string }): McpResult {
  return wrap(() => installSkill(args.sourcePath), JSON.stringify(args));
}

// ── Command handlers ──────────────────────────────────────────────────────────
export function commandRun(args: { name: string; task?: string }): McpResult {
  return wrap(() => runCommand(args.name, args.task ?? ""), JSON.stringify(args));
}

export function commandList(): McpResult {
  return wrap(() => listCommands(), "{}");
}

// ── Hook handlers ─────────────────────────────────────────────────────────────
export function hookTrigger(args: { name: string; context?: Record<string, string> }): McpResult {
  return wrap(() => triggerHook(args.name, args.context ?? {}), JSON.stringify(args));
}

export function hookList(): McpResult {
  return wrap(() => listHooks(), "{}");
}

// ── Settings handlers ─────────────────────────────────────────────────────────
export function settingsApply(args: { name: string }): McpResult {
  return wrap(() => applyPreset(args.name), JSON.stringify(args));
}

export function settingsList(): McpResult {
  return wrap(() => loadPresets().map(p => ({ name: p.name, description: p.description })), "{}");
}

// ── Marketplace handlers ──────────────────────────────────────────────────────
export async function marketplaceSearch(args: { query?: string; type?: string }): Promise<McpResult> {
  // Auto-populate registry from built-ins on first use (empty registry)
  if (loadRegistry().length === 0) {
    await refreshRegistry();
  }
  return wrap(() => searchMarketplace({ query: args.query, type: args.type as never }), JSON.stringify(args));
}

export async function marketplaceInstall(args: { source: string }): Promise<McpResult> {
  const { source } = args;
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return wrapAsync(() => installFromUrl(source), JSON.stringify(args));
  }
  return wrap(() => installFromPath(source), JSON.stringify(args));
}

// ── Workflow handlers ─────────────────────────────────────────────────────────
export async function workflowRun(args: { name: string; context?: string }): Promise<McpResult> {
  return wrapAsync(() => runWorkflow(args.name, args.context ?? ""), JSON.stringify(args));
}

export function workflowList(): McpResult {
  return wrap(() => listWorkflows(), "{}");
}
