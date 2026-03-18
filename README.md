# ClawForge 🦀

> Open-source, local-first personal AI assistant — an agentic runtime with persistent memory, skills, browser control, and Claude Code parity.

## What is ClawForge?

ClawForge combines the best of **Claude Code** (code generation, debugging, browser control, git, testing) with **OpenClaw-style features** (persistent vector memory, skills/plugins, cron scheduling, background tasks) — all in one terminal command.

## Features

- **Persistent Gateway Daemon** — stays alive between sessions
- **Rich Terminal UI (TUI)** — built with Ink
- **10 Built-in Skills** — file-ops, shell, code, debug, browser, web-search, git-ops, test-runner, design, memory
- **Vector Memory** — SQLite + sqlite-vec for semantic recall across conversations
- **Multi-model Support** — Anthropic Claude, OpenAI, Ollama (local)
- **Cron Scheduler** — autonomous background tasks
- **Browser Control** — Playwright-based Chromium automation

## Quick Start

```bash
npm install
npm run build
clawforge init
clawforge start
clawforge tui
```

## Architecture

```
Gateway (Daemon) ← WebSocket → CLI / TUI
     │
     ├── Agent Runtime (plan → act → observe → repeat)
     ├── Tool System (file, shell, code, browser, search, git, test, debug, design, http)
     ├── Memory System (summarize → embed → sqlite-vec → cosine recall)
     ├── Skills Loader
     └── Cron Scheduler
```

## Tech Stack

- Node.js 22+ / TypeScript (monorepo)
- `@anthropic-ai/sdk` — Claude API
- `better-sqlite3` + `sqlite-vec` — local vector database
- `playwright` — browser automation
- `ink` — terminal UI
- `ws` — WebSocket server/client

## License

MIT
