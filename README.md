# ClawForge 🦀

> A local MCP toolkit that extends Claude Code with browser control, persistent vector memory, web search, sub-agents, slash commands, hooks, a component marketplace, and more.

**Repo**: https://github.com/kaizokuni/clawforge
**License**: MIT
**Platform**: Windows (primary), macOS, Linux
**Status**: Phase 1 Complete — Foundation

---

## What Is ClawForge?

ClawForge plugs INTO Claude Code as an **MCP server**. It does NOT replace Claude Code — it adds **35 tools** that Claude Code doesn't have natively.

**What Claude Code already does** (we don't rebuild): File editing, shell, git, code generation, tests.

**What ClawForge adds (16 capabilities):**

| # | Capability | Description |
|---|-----------|-------------|
| 1 | **Browser Control** | Playwright: navigate, click, type, screenshot, scrape, evaluate JS |
| 2 | **Persistent Vector Memory** | Auto-capture observations → LLM compression → SQLite + sqlite-vec |
| 3 | **Web Search** | DuckDuckGo scraping + full page fetcher + summarizer |
| 4 | **Design Preview Loop** | Generate UI → browser preview → screenshot → LLM evaluates → iterate |
| 5 | **Cron / Background Tasks** | Scheduled recurring tasks |
| 6 | **Skills System** | Antigravity-compatible SKILL.md format |
| 7 | **Project Indexer** | Codebase → chunked → embedded → semantic search |
| 8 | **Sub-Agents** | 8 built-in specialist agents |
| 9 | **MCP Integration Hub** | Meta-MCP router to external MCP servers |
| 10 | **Monitoring Dashboard** | Web UI + TUI for token/cost tracking |
| 11 | **Slash Commands** | Custom `/commands` as markdown files |
| 12 | **Hooks** | Automation triggers (pre-commit, on-error, file-change, etc.) |
| 13 | **Settings Presets** | Permission profiles (full-access, read-only, ci-mode) |
| 14 | **Component Marketplace** | Browse, search, install components |
| 15 | **Bundles & Workflows** | Starter packs + chained skill→agent→command playbooks |
| 16 | **Template Stacks** | One command installs a full dev environment |

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

**Two integration modes:**
- **MCP Server** (primary) — Claude Code sees all 35 tools natively
- **CLI** (fallback) — `clawforge <command>` for everything

---

## 35 MCP Tools

| Category | Tools |
|----------|-------|
| **Browser (6)** | `browser_open`, `browser_screenshot`, `browser_click`, `browser_type`, `browser_evaluate`, `browser_content` |
| **Memory (5)** | `memory_search`, `memory_timeline`, `memory_get_observations`, `memory_store`, `memory_status` |
| **Web Search (2)** | `web_search`, `web_fetch` |
| **Design (2)** | `design_preview`, `design_iterate` |
| **Project Index (2)** | `index_project`, `index_search` |
| **Sub-Agents (2)** | `agent_delegate`, `agent_list` |
| **MCP Hub (2)** | `mcp_route`, `mcp_list_servers` |
| **Monitoring (2)** | `monitor_status`, `monitor_cost` |
| **Cron (3)** | `cron_schedule`, `cron_list`, `cron_remove` |
| **Skills (3)** | `skill_run`, `skill_list`, `skill_install` |
| **Commands (2)** | `command_run`, `command_list` |
| **Hooks (2)** | `hook_trigger`, `hook_list` |
| **Settings (2)** | `settings_apply`, `settings_list` |
| **Marketplace (2)** | `marketplace_search`, `marketplace_install` |
| **Workflows (2)** | `workflow_run`, `workflow_list` |

---

## Project Structure

```
clawforge/
├── CLAUDE.md                        # Master project spec
├── README.md                        # This file
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript strict mode config
├── .gitignore
│
├── src/
│   ├── index.ts                     # Entry: CLI + MCP routing
│   ├── mcp/                         # MCP stdio server
│   ├── cli/                         # Commander.js CLI
│   ├── tools/
│   │   ├── browser/                 # Playwright automation
│   │   ├── memory/                  # Vector memory (SQLite + sqlite-vec)
│   │   ├── search/                  # Web search + fetcher
│   │   ├── design/                  # Design preview loop
│   │   ├── indexer/                 # Codebase semantic search
│   │   ├── agents/                  # Sub-agent delegation
│   │   ├── mcp-hub/                 # External MCP server router
│   │   ├── monitor/                 # Dashboard + tracking
│   │   ├── cron/                    # Task scheduling
│   │   ├── skills/                  # Skill loader/executor
│   │   ├── commands/                # Slash command system
│   │   ├── hooks/                   # Automation triggers
│   │   ├── settings/                # Permission presets
│   │   ├── marketplace/             # Component marketplace
│   │   └── workflows/               # Multi-step orchestration
│   ├── daemon/                      # Background service
│   └── shared/                      # Types, config, logger, constants
│
├── skills/          # 8 built-in skills (Phase 6)
├── agents/          # 8 built-in agents (Phase 6)
├── commands/        # 10 built-in commands (Phase 6)
├── hooks/           # 8 built-in hooks (Phase 6)
├── settings/        # 5 built-in presets (Phase 6)
├── bundles/         # 4 curated bundles (Phase 6)
├── workflows/       # 4 playbooks (Phase 6)
├── stacks/          # 4 template stacks (Phase 6)
├── templates/       # Handlebars templates (Phase 6)
└── tests/           # Test suite (Phase 7)
```

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server protocol |
| `better-sqlite3` + `sqlite-vec` | Local vector database |
| `@anthropic-ai/sdk` | Claude API |
| `playwright` | Browser automation |
| `ollama` | Local model inference + embeddings |
| `commander` | CLI argument parsing |
| `ink` + `ink-text-input` | Terminal UI |
| `cheerio` + `undici` | Web scraping + HTTP |
| `@mozilla/readability` | Article extraction |
| `node-cron` | Task scheduling |
| `yaml` + `zod` | Config parsing + validation |
| `gray-matter` | Markdown frontmatter parsing |
| `chokidar` | File watching for hooks |
| `handlebars` | Template rendering |
| `express` | Monitor dashboard web server |
| `glob` | File pattern matching |

---

## Build Plan (7 Phases)

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation: scaffold, types, config, logger, constants, entry point | ✅ Complete |
| **Phase 2** | Core Tools: memory, browser, web search, design, indexer, cron | ⬜ Next |
| **Phase 3** | Advanced: sub-agents, MCP hub, monitoring dashboard, skills | ⬜ Pending |
| **Phase 4** | Ecosystem: commands, hooks, settings, marketplace, workflows | ⬜ Pending |
| **Phase 5** | Integration: MCP server, CLI, daemon | ⬜ Pending |
| **Phase 6** | Content: 8 skills, 8 agents, 10 commands, 8 hooks, 5 presets, bundles, stacks | ⬜ Pending |
| **Phase 7** | Polish: README, tests, integration testing, final build | ⬜ Pending |

---

## Phase 1 Report

### What was built

- **Project scaffold** — `package.json`, `tsconfig.json` (strict mode, ESM, path aliases)
- **21 source directories** — All tool modules, CLI, MCP, daemon, shared
- **9 content directories** — skills, agents, commands, hooks, settings, bundles, workflows, stacks, templates
- **31 AGENTS.md files** — Every directory documented with purpose, integration, key files, dependencies, conventions
- **5 shared modules** — All with real implementations:
  - `types.ts` — 40+ TypeScript interfaces (Tool I/O, MCP messages, Memory, Config, Components, Browser, Cron, Monitor, Marketplace)
  - `config.ts` — Loads `~/.clawforge/config.yaml` with zod validation, auto-creates defaults
  - `logger.ts` — Structured JSON logger with file output + stderr for errors/warnings
  - `constants.ts` — All paths, ports, limits, version constants
  - `platform.ts` — Cross-platform OS detection, path normalization, helpers
- **Entry point** (`src/index.ts`) — Routes to MCP server or CLI mode based on arguments

### Verification

```
✅ npm install         — 22 dependencies + 6 devDependencies installed
✅ npx tsc --noEmit    — Zero type errors
✅ npx tsc && node dist/index.js --version  — Builds and prints "clawforge v0.1.0"
✅ better-sqlite3      — Native module compiled successfully on Windows
```

### Key Dependencies Installed

All 22 production dependencies from the spec are installed and type-checked:
`@modelcontextprotocol/sdk`, `better-sqlite3`, `sqlite-vec`, `playwright`, `ollama`, `@anthropic-ai/sdk`, `commander`, `cheerio`, `undici`, `node-cron`, `yaml`, `zod`, `glob`, `@mozilla/readability`, `handlebars`, `ink`, `ink-text-input`, `express`, `gray-matter`, `chokidar`

---

## Quick Start (after all phases)

```bash
npm install -g clawforge
clawforge setup          # First-time global setup
clawforge init           # Initialize in current project
# Restart Claude Code — 35 new tools appear automatically
```

---

## Conventions

- TypeScript strict mode, no `any`
- Cross-platform: `path.join()` everywhere, never hardcoded slashes
- Every tool returns structured `ToolResult`, never crashes
- Structured JSON logging to `~/.clawforge/logs/`
- JSDoc on every public function
- `zod` schemas for all config + tool inputs
- AGENTS.md in every directory

---

## License

MIT
