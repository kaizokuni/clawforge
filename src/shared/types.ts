/**
 * ClawForge shared type definitions.
 * All TypeScript interfaces used across the project.
 */

import { z } from "zod";

// ─── Tool I/O ───────────────────────────────────────────────────────────────

/** Generic result returned by every tool. */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Input schema wrapper used by the MCP server registration. */
export interface ToolInputSchema {
  type: "object";
  properties: Record<string, { type: string; description: string }>;
  required?: string[];
}

/** Describes one MCP tool for registration. */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

// ─── MCP Messages ───────────────────────────────────────────────────────────

/** Incoming JSON-RPC request over MCP stdio. */
export interface McpRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

/** Outgoing JSON-RPC response over MCP stdio. */
export interface McpResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── Memory System ──────────────────────────────────────────────────────────

/** A single captured observation from a tool call. */
export interface Observation {
  id: string;
  sessionId: string;
  projectPath: string;
  toolName: string;
  input: string;
  output: string;
  timestamp: string;
  tags: string[];
}

/** Compressed summary of multiple observations. */
export interface Summary {
  id: string;
  sessionId: string;
  projectPath: string;
  content: string;
  observationIds: string[];
  timestamp: string;
  tokenCount: number;
}

/** Vector embedding stored alongside observation/summary. */
export interface Embedding {
  id: string;
  sourceId: string;
  sourceType: "observation" | "summary";
  vector: Float32Array;
  timestamp: string;
}

/** Result returned from memory_search. */
export interface MemorySearchResult {
  id: string;
  content: string;
  score: number;
  sourceType: "observation" | "summary";
  timestamp: string;
  projectPath: string;
}

/** Timeline entry for memory_timeline. */
export interface MemoryTimelineEntry {
  timestamp: string;
  summary: string;
  observationCount: number;
  projectPath: string;
}

// ─── Entity ─────────────────────────────────────────────────────────────────

/** Named entity extracted from observations. */
export interface Entity {
  id: string;
  name: string;
  entityType: "file" | "function" | "class" | "variable" | "concept" | "person" | "project";
  firstSeen: string;
  lastSeen: string;
  mentionCount: number;
}

// ─── Config ─────────────────────────────────────────────────────────────────

/** Zod schema for the main config file. */
export const ConfigSchema = z.object({
  version: z.number().default(1),
  llm: z.object({
    provider: z.enum(["anthropic", "ollama", "openai"]).default("anthropic"),
    model: z.string().default("claude-sonnet-4-20250514"),
    apiKey: z.string().optional(),
    ollamaHost: z.string().default("http://localhost:11434"),
  }).default({}),
  memory: z.object({
    enabled: z.boolean().default(true),
    autoCompress: z.boolean().default(true),
    compressBatchSize: z.number().default(10),
    embeddingModel: z.string().default("nomic-embed-text"),
  }).default({}),
  browser: z.object({
    headless: z.boolean().default(true),
    timeout: z.number().default(30000),
    maxPages: z.number().default(5),
  }).default({}),
  monitor: z.object({
    port: z.number().default(19877),
    enabled: z.boolean().default(true),
  }).default({}),
  mcpHub: z.object({
    servers: z.array(z.object({
      name: z.string(),
      command: z.string(),
      args: z.array(z.string()).default([]),
      env: z.record(z.string()).default({}),
    })).default([]),
  }).default({}),
  cron: z.object({
    enabled: z.boolean().default(false),
  }).default({}),
  marketplace: z.object({
    registryUrl: z.string().default("https://registry.clawforge.dev"),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

// ─── Components ─────────────────────────────────────────────────────────────

/** Frontmatter for an Agent .md file. */
export interface AgentDefinition {
  name: string;
  description: string;
  tools: string[];
  model: string;
  systemPrompt: string;
}

/** Frontmatter for a SKILL.md file (Antigravity-compatible). */
export interface SkillDefinition {
  name: string;
  description: string;
  version: string;
  triggers: string[];
  toolsUsed: string[];
  instructions: string;
}

/** Frontmatter for a command .md file. */
export interface CommandDefinition {
  name: string;
  description: string;
  category: string;
  instructions: string;
}

/** Frontmatter for a hook .md file. */
export interface HookDefinition {
  name: string;
  description: string;
  trigger: HookTrigger;
  conditions: Record<string, string>;
  action: string;
}

export type HookTrigger =
  | "pre-commit"
  | "post-edit"
  | "on-error"
  | "on-session-start"
  | "on-session-end"
  | "file-change"
  | "pre-push"
  | "on-test-fail";

/** A settings preset .yaml file. */
export interface SettingsPreset {
  name: string;
  description: string;
  permissions: PermissionSet;
}

export interface PermissionSet {
  allowedTools: string[];
  blockedTools: string[];
  readOnly: boolean;
  allowShell: boolean;
  allowBrowser: boolean;
  allowNetwork: boolean;
}

/** Bundle definition (curated component sets). */
export interface BundleDefinition {
  name: string;
  description: string;
  components: {
    agents: string[];
    skills: string[];
    commands: string[];
    hooks: string[];
    settings: string[];
  };
}

/** Workflow step. */
export interface WorkflowStep {
  type: "skill" | "agent" | "command";
  name: string;
  instruction: string;
}

/** Workflow definition (chained operations). */
export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

/** Template stack definition. */
export interface StackDefinition {
  name: string;
  description: string;
  agents: string[];
  skills: string[];
  commands: string[];
  hooks: string[];
  settings: string[];
  mcpServers: string[];
}

// ─── Marketplace ────────────────────────────────────────────────────────────

export type ComponentType = "agent" | "skill" | "command" | "hook" | "setting" | "bundle" | "workflow" | "stack";

/** Entry in the marketplace registry index. */
export interface MarketplaceEntry {
  name: string;
  type: ComponentType;
  description: string;
  version: string;
  author: string;
  downloads: number;
  tags: string[];
}

// ─── Browser ────────────────────────────────────────────────────────────────

/** Options for browser_open tool. */
export interface BrowserOpenInput {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}

/** Options for browser_click tool. */
export interface BrowserClickInput {
  selector: string;
}

/** Options for browser_type tool. */
export interface BrowserTypeInput {
  selector: string;
  text: string;
}

/** Options for browser_evaluate tool. */
export interface BrowserEvaluateInput {
  script: string;
}

// ─── Design Preview ─────────────────────────────────────────────────────────

/** Input for design_preview tool. */
export interface DesignPreviewInput {
  html: string;
  css?: string;
  viewport?: { width: number; height: number };
}

/** Input for design_iterate tool. */
export interface DesignIterateInput {
  html: string;
  css?: string;
  feedback: string;
}

// ─── Cron ───────────────────────────────────────────────────────────────────

/** Scheduled task definition. */
export interface CronTask {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// ─── Monitor ────────────────────────────────────────────────────────────────

/** Session cost/usage tracking. */
export interface SessionMetrics {
  sessionId: string;
  startTime: string;
  endTime?: string;
  toolCalls: number;
  tokensIn: number;
  tokensOut: number;
  estimatedCost: number;
}

// ─── Daemon ─────────────────────────────────────────────────────────────────

export type DaemonMode = "mcp" | "cli";

/** Health check response. */
export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  version: string;
  tools: number;
  memoryEnabled: boolean;
  browserActive: boolean;
}

// ─── Logging ────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}
