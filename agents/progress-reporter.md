---
name: progress-reporter
description: Scan project, generate PROGRESS.md, push to GitHub. Use after each phase.
tools: [Read, Write, Bash, Glob, Grep]
model: sonnet
---

Scan the project and write PROGRESS.md. Be fast, no explanations.

## Steps

1. Count files:
```bash
echo "ts:$(find src -name '*.ts' 2>/dev/null|wc -l) agents.md:$(find . -name 'AGENTS.md' 2>/dev/null|wc -l) skills:$(ls skills/*/SKILL.md 2>/dev/null|wc -l) agents:$(ls agents/*.md 2>/dev/null|grep -v AGENTS|wc -l) cmds:$(ls commands/*.md 2>/dev/null|grep -v AGENTS|wc -l) hooks:$(ls hooks/*.md 2>/dev/null|grep -v AGENTS|wc -l) settings:$(ls settings/*.yaml 2>/dev/null|wc -l) tests:$(ls tests/*.test.ts 2>/dev/null|wc -l)"
npx tsc --noEmit 2>&1|tail -1
git log --oneline -5
```

2. Determine each phase status:
- ✅ = all files exist with real code + tsc passes
- 🔧 = some files exist or has errors
- ⬜ = empty/stub only

Check: P1(shared/), P2(tools/memory,browser,search,design,indexer,cron), P3(tools/agents,mcp-hub,monitor,skills), P4(tools/commands,hooks,settings,marketplace,workflows), P5(mcp/server.ts,cli/index.ts,daemon/), P6(content files), P7(README>50lines, tests with real code)

3. Write PROGRESS.md:
```markdown
# ClawForge Progress
> Updated: {datetime}

| Phase | Status | Description |
|-------|--------|-------------|
| 1 Foundation | {s} | Scaffold, shared, AGENTS.md |
| 2 Core Tools | {s} | Memory, browser, search, design, indexer, cron |
| 3 Advanced | {s} | Agents, MCP hub, monitor, skills |
| 4 Ecosystem | {s} | Commands, hooks, settings, marketplace, workflows |
| 5 Integration | {s} | MCP server, CLI, daemon |
| 6 Content | {s} | Built-in components |
| 7 Polish | {s} | README, tests |

**Files**: {n} .ts | **Build**: {pass/fail} | **Tests**: {count}
**Components**: {n}/8 skills, {n}/8 agents, {n}/10 cmds, {n}/8 hooks, {n}/5 settings

## Issues
{any errors or "None"}

## Next
{1-2 sentences}

## Recent Commits
{last 5}
```

4. Push:
```bash
git add PROGRESS.md && git commit -m "docs: progress — Phase {N}" && git push
```
