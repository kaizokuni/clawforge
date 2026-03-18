# ClawForge

MCP toolkit extending Claude Code. 35 tools, 16 capabilities. Repo: github.com/kaizokuni/clawforge

## Capabilities
Browser (Playwright), Vector Memory (SQLite+sqlite-vec, claude-mem style progressive disclosure), Web Search (DuckDuckGo), Design Preview, Cron, Skills (Antigravity-compatible), Project Indexer, Sub-Agents (8 built-in), MCP Hub (meta-router), Monitor Dashboard (:19877+TUI), Slash Commands, Hooks, Settings Presets, Marketplace, Bundles/Workflows, Template Stacks.

## Architecture
Claude Code →MCP(stdio)→ ClawForge Daemon → Tool Engine → [Browser|Memory|Search|Design|Indexer|Agents|MCP-Hub|Monitor|Cron|Skills|Commands|Hooks|Settings|Marketplace|Workflows]

Storage: ~/.clawforge/ (config.yaml, data/memory.db, agents/, skills/, commands/, hooks/, settings/, mcp/, cron/, monitor/, marketplace/, logs/)

## 35 MCP Tools
Browser(6): browser_open, browser_screenshot, browser_click, browser_type, browser_evaluate, browser_content
Memory(5): memory_search, memory_timeline, memory_get_observations, memory_store, __IMPORTANT
Search(2): web_search, web_fetch | Design(2): design_preview, design_iterate
Index(2): index_project, index_search | Agents(2): agent_delegate, agent_list
MCP-Hub(2): mcp_route, mcp_list_servers | Monitor(2): monitor_status, monitor_cost
Cron(3): cron_schedule, cron_list, cron_remove | Skills(3): skill_run, skill_list, skill_install
Commands(2): command_run, command_list | Hooks(2): hook_trigger, hook_list
Settings(2): settings_apply, settings_list | Marketplace(2): marketplace_search, marketplace_install
Workflows(2): workflow_run, workflow_list

## Structure
src/ → mcp/ (server,tools,handlers) | cli/ (18 command files) | tools/ (15 modules) | daemon/ (service,process,health) | shared/ (types,config,logger,constants,platform)
Content: skills/(8) agents/(8) commands/(10) hooks/(8) settings/(5) bundles/(4) workflows/(4) stacks/(4)

## Stack
TS strict, Node 22+, @modelcontextprotocol/sdk, better-sqlite3, sqlite-vec, playwright, ollama, @anthropic-ai/sdk, commander, cheerio, undici, node-cron, zod, gray-matter, ink, express, chokidar

## Conventions
- TS strict, no `any`. Zod for all inputs. JSDoc on public functions.
- path.join() everywhere (Windows primary). AGENTS.md in every dir.
- Tools return structured results, never crash. Graceful Playwright cleanup.
