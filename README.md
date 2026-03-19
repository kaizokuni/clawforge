# ClawForge 🦀

> A local MCP toolkit that extends Claude Code with browser control, persistent vector memory, web search, sub-agents, slash commands, hooks, a component marketplace, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![MCP SDK](https://img.shields.io/badge/MCP-SDK-blue)](https://github.com/modelcontextprotocol/sdk)

---

## Hero

ClawForge plugs into Claude Code as an MCP server and adds **37 tools** across 16 capabilities that Claude Code doesn't ship with — browser control, vector memory, web search, design preview, scheduled tasks, sub-agents, project indexing, monitoring, and more.

It does **not** replace Claude Code. It extends it.

---

## Features

| Capability | Tools | What it does |
|---|---|---|
| **Browser Control** | 6 | Navigate, click, type, screenshot, eval JS via Playwright |
| **Persistent Memory** | 5 | Auto-capture every tool call → SQLite + sqlite-vec. Cross-project. 3-layer progressive disclosure. |
| **Web Search** | 2 | DuckDuckGo + full page fetcher with readability extraction |
| **Design Preview** | 2 | Render HTML/CSS in browser → screenshot → LLM iterate loop |
| **Project Indexer** | 2 | Chunk & embed codebase → semantic search across thousands of files |
| **Sub-Agents** | 2 | 8 specialist agents (frontend, backend, security, debug, test, devops, research, review) |
| **MCP Hub** | 2 | Meta-router: one MCP connection routes to GitHub, Slack, Notion, PostgreSQL, any MCP server |
| **Monitoring** | 2 | Web UI at `:19877` + TUI. Live activity, token/cost tracking, memory browser |
| **Cron / Background** | 3 | Schedule recurring tasks that run even when Claude Code is idle |
| **Skills** | 3 | Antigravity-compatible SKILL.md format, portable across Claude Code / Gemini / Codex / Cursor |
| **Commands** | 2 | Custom `/commands` as markdown files. 10 built-in. |
| **Hooks** | 2 | Automation triggers: pre-commit, post-edit, on-error, session-start/end, file-change, pre-push |
| **Settings Presets** | 2 | Permission profiles: full-access, read-only, ci-mode, security-audit, pair-programming |
| **Marketplace** | 2 | Browse, search, install community components. Batch stack install. |
| **Workflows** | 2 | Multi-step playbooks: skill → agent → command chained execution |
| **Template Stacks** | — | One-command installs a full dev environment |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/kaizokuni/clawforge
cd clawforge
npm install

# 2. Build
npm run build

# 3. Global setup (installs Playwright, pulls Ollama model, creates ~/.clawforge/)
node dist/index.js setup --api-key YOUR_ANTHROPIC_API_KEY

# 4. Initialize in your project
cd /your/project
node /path/to/clawforge/dist/index.js init

# 5. Restart Claude Code — ClawForge's 37 tools are now available
```

Or install globally:

```bash
npm install -g .
clawforge setup --api-key YOUR_KEY
cd /your/project && clawforge init
```

---

## Installation

### Prerequisites

- **Node.js ≥ 18** (Node 22 recommended)
- **Anthropic API key** (for memory compression and agent delegation)
- **Ollama** (optional, for local embeddings — falls back to OpenAI or zero vector)
- **Playwright Chromium** (installed automatically by `clawforge setup`)

### Step-by-step

```bash
git clone https://github.com/kaizokuni/clawforge
cd clawforge
npm install
npm run build
node dist/index.js setup
```

`setup` will:

1. Create `~/.clawforge/` directory structure
2. Initialize the SQLite + sqlite-vec database
3. Copy all 8 skills, 8 agents, 10 commands, 8 hooks, 5 settings presets
4. Seed the marketplace registry
5. Install Playwright Chromium
6. Pull `nomic-embed-text` via Ollama
7. Print the MCP config snippet to add to Claude Code

### MCP Configuration

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "clawforge": {
      "command": "node",
      "args": ["/path/to/clawforge/dist/index.js", "mcp"]
    }
  }
}
```

Or run `clawforge init` in your project — it auto-generates this config and a `CLAUDE.md` listing all tools.

---

## Usage

### As MCP Server (primary)

Once configured, Claude Code sees all 37 tools automatically. Just talk to Claude:

```
"Search the web for the latest Playwright docs"
"Take a screenshot of https://example.com"
"What did we work on last week?" (memory search)
"Run the code-review skill on src/"
"Schedule a daily summary at 9am"
```

### CLI (fallback / scripting)

```bash
# Browser
clawforge browser open https://example.com
clawforge browser screenshot

# Memory
clawforge memory search "authentication bug"
clawforge memory store feature "Dark mode" "Added CSS variables for theming"

# Web search
clawforge search "TypeScript strict mode best practices"
clawforge fetch https://example.com

# Skills
clawforge skill run code-review
clawforge skill list

# Agents
clawforge agent delegate "Review security of src/auth/" --agent security-auditor

# Cron
clawforge cron schedule "daily-summary" "0 9 * * *" "clawforge skill run session-recap"
clawforge cron list

# Marketplace
clawforge marketplace search "testing"
clawforge marketplace install ./my-skill/

# Daemon
clawforge start        # start background daemon
clawforge status       # check health
clawforge stop         # stop daemon
```

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
```

**Two integration modes:**

- **MCP Server** — `clawforge mcp` (stdio transport). Claude Code sees all tools natively.
- **CLI** — `clawforge <command>` for scripting, CI, or direct use.

**Storage** (`~/.clawforge/`):

```
├── config.yaml           # API keys, model settings
├── data/memory.db        # SQLite + sqlite-vec
├── agents/               # .md agent definitions
├── skills/               # installed SKILL.md dirs
├── commands/             # slash command .md files
├── hooks/                # automation trigger .md files
├── settings/             # permission preset .yaml files
├── mcp/                  # external MCP server configs
├── cron/                 # scheduled task definitions
├── marketplace/          # registry cache
├── monitor/              # session cost/usage history
└── logs/                 # structured JSON logs
```

**Memory system (claude-mem style):**

- Observer auto-captures every tool call in real-time
- Compressor batches observations → LLM summaries (~10x reduction)
- Embedder converts summaries → vectors (Ollama or OpenAI)
- 3-layer retrieval: L1 (auto-inject index) → L2 (timeline) → L3 (full details)
- Works across all your projects from one global DB

---

## Creating Custom Components

### Skill (SKILL.md)

```markdown
---
name: my-skill
description: What this skill does
version: 1.0.0
triggers:
  - "run my skill"
  - "do the thing"
tools_used:
  - web_search
  - memory_store
---

## Instructions

Detailed prompt instructions for Claude to follow when this skill is triggered...
```

Install: `clawforge skill install ./my-skill/`

### Agent

```markdown
---
name: my-agent
description: Specialist description
tools:
  - web_search
  - index_search
model: claude-opus-4-5
---

You are a specialist in X. When delegated a task...
```

### Command

```markdown
---
name: my-command
description: What the command does
category: custom
---

Instructions for Claude to follow when /my-command is invoked...
```

### Hook

```markdown
---
name: my-hook
description: What triggers this
trigger: pre-commit
conditions:
  - "*.ts"
---

Before committing, always check {{files}} for issues...
```

### Workflow

```yaml
name: my-workflow
description: Multi-step playbook
steps:
  - skill: code-review
    instruction: Review the changes
  - agent: security-auditor
    instruction: Check for vulnerabilities
  - command: generate-tests
    instruction: Write tests for any new code
```

---

## Configuration

`~/.clawforge/config.yaml`:

```yaml
version: "1.0"
llm:
  apiKey: "sk-ant-..."
  model: "claude-opus-4-5"
  maxTokens: 8192
  temperature: 0.7
embeddings:
  provider: "ollama"
  ollamaHost: "http://localhost:11434"
  ollamaModel: "nomic-embed-text"
  openaiApiKey: ""
browser:
  headless: true
  timeout: 30000
  poolSize: 2
monitor:
  port: 19877
  enabled: true
  cloudflareEnabled: false
storage:
  maxMemoryItems: 10000
  compressionBatchSize: 20
  retentionDays: 365
```

### Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Overrides config LLM key |
| `OPENAI_API_KEY` | For OpenAI embeddings |
| `OLLAMA_HOST` | Ollama server URL |
| `CLAWFORGE_HOME` | Override `~/.clawforge/` location |
| `CLAWFORGE_LOG_LEVEL` | `debug`, `info`, `warn`, `error` |

---

## Windows Notes

ClawForge is developed with Windows as the primary platform.

- All paths use `path.join()` — no hardcoded slashes
- The daemon uses `child_process.spawn` with `detached: true` (works cross-platform)
- Playwright Chromium installs via `npx playwright install chromium --with-deps`
- SQLite native bindings compile via `node-gyp` — you need Visual Studio Build Tools
- `CLAWFORGE_HOME` defaults to `%USERPROFILE%\.clawforge\` on Windows

**Troubleshooting native builds on Windows:**

```bash
npm install --global windows-build-tools
```

---

## Built-in Content

### Skills (8)
`code-review`, `debug-loop`, `design-system`, `research`, `session-recap`, `security-audit`, `git-workflow`, `test-coverage`

### Agents (8)
`frontend-designer`, `backend-architect`, `security-auditor`, `code-reviewer`, `debug-specialist`, `test-engineer`, `devops`, `researcher`

### Commands (10)
`/generate-tests`, `/optimize-bundle`, `/security-audit`, `/explain-code`, `/refactor`, `/add-docs`, `/fix-lint`, `/generate-api-docs`, `/deploy-checklist`, `/session-recap`

### Hooks (8)
`pre-commit-validation`, `post-edit-typecheck`, `on-error-debug`, `on-session-start-context`, `on-session-end-save`, `file-change-reload`, `pre-push-tests`, `backup-before-edit`

### Settings Presets (5)
`full-access`, `read-only`, `ci-mode`, `security-audit`, `pair-programming`

### Workflows (4)
`ship-feature`, `bug-fix`, `code-review-cycle`, `new-project`

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Install deps: `npm install`
4. Make changes in `src/`
5. Build: `npm run build`
6. Test: `npm test`
7. Type-check: `npm run typecheck`
8. Open a PR

**Adding a new tool:**
1. Implement in `src/tools/<module>/`
2. Register in `src/mcp/tools.ts` via `server.tool()`
3. Add handler in `src/mcp/handlers.ts`
4. Wire CLI in `src/cli/<module>.ts`
5. Add to `templates/CLAUDE.md.hbs` tool list

---

## License

MIT © 2025 [kaizokuni](https://github.com/kaizokuni)

---

*Built to make Claude Code dramatically more capable without replacing what it already does well.*
