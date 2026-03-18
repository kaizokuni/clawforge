# ClawForge 🦀

> A local MCP toolkit that extends Claude Code with browser control, persistent vector memory, web search, sub-agents, slash commands, hooks, a component marketplace, and more.

**Repo**: https://github.com/kaizokuni/clawforge
**License**: MIT
**Platform**: Windows (primary), macOS, Linux

---

## What Is ClawForge?

ClawForge plugs INTO Claude Code as an MCP server. It does NOT replace Claude Code — it adds 35 tools that Claude Code doesn't have natively.

**What Claude Code already does** (we don't rebuild): File editing, shell, git, code gen, tests.

**What ClawForge adds (16 capabilities):**

1. **Browser Control** — Playwright: navigate, click, type, screenshot, scrape, evaluate JS
2. **Persistent Vector Memory** — claude-mem style. Auto-captures every tool call as observations, compresses via LLM (~10x), stores in SQLite + sqlite-vec. Progressive disclosure: lightweight index → timeline → full details on-demand. Works ACROSS projects.
3. **Web Search** — DuckDuckGo scraping + full page fetcher + summarizer
4. **Design Preview Loop** — Generate UI → browser preview → screenshot → LLM evaluates → iterate
5. **Cron / Background Tasks** — Scheduled recurring tasks, run when Claude Code isn't active
6. **Skills System** — Antigravity-compatible SKILL.md format, portable across Claude Code/Gemini/Codex/Cursor
7. **Project Indexer** — Codebase → chunked → embedded → semantic search across thousands of files
8. **Sub-Agents** — 8 built-in specialist agents (markdown files with frontmatter + system prompt)
9. **MCP Integration Hub** — Meta-MCP router: one connection from Claude Code → routes to browser, memory, GitHub, Slack, Notion, PostgreSQL, any user-added MCP server
10. **Monitoring Dashboard** — Web UI at :19877 + TUI. Live activity, token/cost tracking, memory browser. Remote access via Cloudflare Tunnel.
11. **Slash Commands** — Custom `/commands` as markdown files. 10 built-in.
12. **Hooks** — Automation triggers: pre-commit, post-edit, on-error, on-session-start/end, file-change, pre-push, on-test-fail. 8 built-in.
13. **Settings Presets** — Permission profiles (full-access, read-only, ci-mode, security-audit, pair-programming)
14. **Component Marketplace** — Browse, search, install any component. Batch stack install.
15. **Bundles & Workflows** — Bundles = starter packs by role. Workflows = chained skill→agent→command playbooks.
16. **Template Stacks** — One command installs a full dev environment (agents + skills + commands + hooks + settings + MCPs)

---

## Architecture

```
Claude Code ──MCP (stdio)──► ClawForge Daemon
                                 │
                 ┌───────────────┼───────────────────┐
                 ▼               ▼                   ▼
            Tool Engine     Cron Scheduler      Hook Watcher
                 │
    ┌────────────┼────────────────────────────────┐
    ▼            ▼            ▼          ▼        ▼
 Browser     Memory       Search    Agents    MCP Hub
(Playwright) (SQLite+vec) (DDG)   (delegate)  (router)
                 │
         ┌───────┼────────┐
         ▼       ▼        ▼
     Observer  Compressor  Retriever
     (real-time) (LLM)    (3-layer)
```

**Two integration modes (both work):**
- **MCP Server** (primary) — Claude Code sees all 35 tools natively
- **CLI** (fallback) — `clawforge <command>` for everything

**Storage**: `~/.clawforge/`
```
├── config.yaml
├── data/memory.db        (SQLite + sqlite-vec)
├── agents/               (sub-agent .md files)
├── skills/               (installed skills)
├── commands/             (slash command .md files)
├── hooks/                (automation trigger .md files)
├── settings/             (preset .yaml profiles)
├── mcp/                  (external MCP server configs)
├── cron/                 (scheduled task defs)
├── marketplace/          (cached registry index)
├── monitor/              (session cost/usage history)
└── logs/
```

---

## 35 MCP Tools

**Browser (6):** browser_open, browser_screenshot, browser_click, browser_type, browser_evaluate, browser_content
**Memory (5):** memory_search, memory_timeline, memory_get_observations, memory_store, __IMPORTANT
**Web Search (2):** web_search, web_fetch
**Design (2):** design_preview, design_iterate
**Project Index (2):** index_project, index_search
**Sub-Agents (2):** agent_delegate, agent_list
**MCP Hub (2):** mcp_route, mcp_list_servers
**Monitoring (2):** monitor_status, monitor_cost
**Cron (3):** cron_schedule, cron_list, cron_remove
**Skills (3):** skill_run, skill_list, skill_install
**Commands (2):** command_run, command_list
**Hooks (2):** hook_trigger, hook_list
**Settings (2):** settings_apply, settings_list
**Marketplace (2):** marketplace_search, marketplace_install
**Workflows (2):** workflow_run, workflow_list

---

## Project Structure

```
clawforge/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                     # Entry: CLI + daemon
│   ├── mcp/                         # MCP stdio server
│   │   ├── server.ts, tools.ts, handlers.ts
│   ├── cli/                         # Commander.js CLI
│   │   ├── index.ts, browser.ts, memory.ts, search.ts, design.ts,
│   │   │   index-cmd.ts, cron.ts, skill.ts, agent.ts, mcp.ts,
│   │   │   monitor.ts, command.ts, hook.ts, settings.ts,
│   │   │   marketplace.ts, workflow.ts, init.ts, setup.ts
│   ├── tools/                       # Tool implementations
│   │   ├── browser/                 # Playwright: controller, actions, capture, pool
│   │   ├── memory/                  # observer, compressor, embedder, vector-store,
│   │   │                            # retriever, injector, entities, diary
│   │   ├── search/                  # engine, fetcher, summarizer
│   │   ├── design/                  # previewer, iterator
│   │   ├── indexer/                 # scanner, chunker, search
│   │   ├── agents/                  # delegator, loader, runner, scaffolder
│   │   ├── mcp-hub/                 # registry, connector, router, discovery
│   │   ├── monitor/                 # tracker, web-ui, tui, dashboard.html, api
│   │   ├── cron/                    # scheduler, runner
│   │   ├── skills/                  # loader, resolver, executor
│   │   ├── commands/                # loader, executor, scaffolder
│   │   ├── hooks/                   # loader, watcher, executor, scaffolder
│   │   ├── settings/                # loader, applier, validator
│   │   ├── marketplace/             # registry, browser, searcher, installer,
│   │   │                            # stacks, publisher, validator
│   │   └── workflows/               # loader, runner, scaffolder
│   ├── daemon/                      # service, process, health
│   └── shared/                      # types, config, logger, constants, platform
├── skills/          (8 built-in)
├── agents/          (8 built-in)
├── commands/        (10 built-in)
├── hooks/           (8 built-in)
├── settings/        (5 built-in)
├── bundles/         (4 curated)
├── workflows/       (4 playbooks)
├── stacks/          (4 batch-install defs)
├── templates/       (CLAUDE.md.hbs)
└── tests/
```

---

## Key Dependencies

`@modelcontextprotocol/sdk`, `better-sqlite3`, `sqlite-vec`, `playwright`,
`ollama`, `@anthropic-ai/sdk`, `commander`, `cheerio`, `undici`, `node-cron`,
`yaml`, `zod`, `glob`, `@mozilla/readability`, `handlebars`, `ink`,
`ink-text-input`, `express`, `gray-matter`, `chokidar`

---

## Conventions

- TypeScript strict mode, no `any`
- Windows/macOS/Linux: use `path.join()` everywhere, never hardcode slashes
- Every tool returns structured results, never crashes
- Graceful Playwright cleanup on exit
- Structured JSON logging to `~/.clawforge/logs/`
- JSDoc on every public function
- `zod` schemas for all config + tool inputs
- AGENTS.md in every directory

---

## Memory System (claude-mem style)

**While session active**: Observer silently captures every tool call → Compressor batches into summaries via LLM (~10x reduction) → Embedder converts to vectors → SQLite stores everything

**On new session start**: Progressive disclosure — Layer 1: auto-inject lightweight index (~50 tokens/item). Layer 2: `memory_timeline` for context around observation. Layer 3: `memory_get_observations` for full details. Only pay for what you need.

**Cross-project**: One global DB. Query from any folder.
**Auto-CLAUDE.md**: Per-folder activity timelines auto-generated.

---

## Component Formats

**Skills**: Antigravity-compatible SKILL.md with YAML frontmatter (name, description, version, triggers, tools_used)
**Agents**: Markdown with YAML frontmatter (name, description, tools, model) + system prompt body
**Commands**: Markdown with YAML frontmatter (name, description, category) + instruction prompt body
**Hooks**: Markdown with YAML frontmatter (name, description, trigger, conditions) + action prompt body
**Settings**: YAML files with permissions, tool allowlists/blocklists
**Bundles**: YAML files listing components by role
**Workflows**: YAML files with ordered steps (skill/agent/command + instruction)
**Stacks**: YAML files defining full dev environment installs
