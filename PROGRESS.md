# ClawForge Progress
> Updated: 2026-03-19

| Phase | Status | Description |
|-------|--------|-------------|
| 1 Foundation | ✅ | Scaffold, shared, AGENTS.md (31 files) |
| 2 Core Tools | ✅ | Memory, browser, search, design, indexer, cron |
| 3 Advanced | ✅ | Agents, MCP hub, monitor, skills |
| 4 Ecosystem | ✅ | Commands, hooks, settings, marketplace, workflows |
| 5 Integration | ✅ | MCP server (37 tools), CLI (18 cmds), daemon |
| 6 Content | ✅ | 8 skills, 8 agents, 10 cmds, 8 hooks, 5 settings |
| 7 Polish | ✅ | README, 105 tests (10 files), v1.0.0 |
| 8 Operational | ✅ | Running on-device, web UI live at :19877, MCP connected |

**Files**: 87 .ts | **Build**: ✅ tsc (0 errors) | **Tests**: ✅ 105/105 (vitest)
**Components**: 8/8 skills, 8/8 agents, 10/10 cmds, 8/8 hooks, 5/5 settings
**Status**: 🟢 LIVE — daemon PID healthy, port 19877 up, MCP wired to Claude Code

---

## v1.0.0 — Fully Operational

### All 37 MCP Tools
```
browser_open, browser_screenshot, browser_click, browser_type, browser_evaluate, browser_content
memory_search, memory_timeline, memory_get_observations, memory_store, __IMPORTANT
web_search, web_fetch
design_preview, design_iterate
index_project, index_search
agent_delegate, agent_list
mcp_route, mcp_list_servers
monitor_status, monitor_cost
cron_schedule, cron_list, cron_remove
skill_run, skill_list, skill_install
command_run, command_list
hook_trigger, hook_list
settings_apply, settings_list
marketplace_search, marketplace_install
workflow_run, workflow_list
```

### CLI (18 subcommands)
```
browser · memory · search · design · index
cron · skill · agent · mcp · monitor
command · hook · settings · marketplace · workflow
init · setup · start/stop/status (daemon)
```

### On-Device Setup (Windows)
- Daemon: `clawforge start` → PID file at `~/.clawforge/daemon.pid`
- Monitor UI: `http://localhost:19877` (live)
- Playwright Chromium: installed at `%APPDATA%\Local\ms-playwright\`
- MCP config: `~/.claude/.mcp.json` → wired to Claude Code
- 45 built-in components in `~/.clawforge/`
- 44 marketplace entries seeded

### Test Coverage (105 tests, 10 files)
| File | Tests |
|------|-------|
| constants.test.ts | 12 |
| marketplace-validator.test.ts | 12 |
| settings-applier.test.ts | 8 |
| commands.test.ts | 10 |
| hooks.test.ts | 9 |
| skills.test.ts | 10 |
| indexer.test.ts | 11 |
| workflows.test.ts | 8 |
| agents.test.ts | 9 |
| integration.test.ts | 16 |

### Tool Modules (15 complete)
| Module | Files | Key capability |
|--------|-------|----------------|
| browser | 4 | Playwright: navigate, click, type, screenshot, content |
| memory | 8 | SQLite+vec, 3-layer retrieval, compression, entities, diary |
| search | 3 | DuckDuckGo scraping, fetch, summarizer |
| design | 2 | HTML preview loop, iteration capture |
| indexer | 3 | Chunked semantic codebase index |
| agents | 4 | Loader, delegator, Claude API runner, scaffolder |
| mcp-hub | 4 | Registry, SDK connector, discovery, router |
| monitor | 4 | Cost tracker, REST API+SSE, web UI :19877, TUI |
| cron | 2 | node-cron scheduler + runner |
| skills | 3 | SKILL.md loader, resolver, executor |
| commands | 3 | .md loader, executor, scaffolder |
| hooks | 4 | Loader, chokidar watcher, executor, scaffolder |
| settings | 3 | Loader, runtime permission applier, validator |
| marketplace | 7 | Registry, searcher, installer, stacks, browser, publisher, security scan |
| workflows | 3 | YAML loader, sequential runner (context chaining), scaffolder |

---

## Commits
```
e22a0de feat: Phase 7 - README, tests (105 passing), v1.0.0
5e0677c feat: Phase 6 - built-in content + enhanced setup/init
af9d79b docs: progress report — P1-P5 complete
17ab62c feat: Phase 5 - MCP server, CLI, daemon wiring
62d67ca feat: Phase 4 - commands, hooks, settings, marketplace, workflows
d57f426 feat: Phase 3 - agents, MCP hub, monitor, skills
c5fb653 docs: progress — Phase 2 complete
c2bfe86 feat: Phase 2 - core tools (memory, browser, search, design, indexer, cron)
140c3bc feat: Phase 1 complete — foundation scaffold
```

**Repo**: https://github.com/kaizokuni/clawforge | **License**: MIT
