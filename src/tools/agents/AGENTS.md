# src/tools/agents/

## Purpose
Sub-agent system. Load agent definitions from markdown files, delegate tasks, run with restricted tool access.

## Integration
MCP tools: `agent_delegate`, `agent_list`

## Key Files
- `loader.ts` — Discover .md files, parse YAML frontmatter with gray-matter
- `delegator.ts` — Match task description to best agent by name/description
- `runner.ts` — Execute agent: construct system prompt, restrict tools, call Claude API
- `scaffolder.ts` — `clawforge agent create <name>` generates template .md

## Dependencies
- **npm**: `gray-matter`, `@anthropic-ai/sdk`
- **internal**: `src/shared/`

## Conventions
- Agents defined as markdown with YAML frontmatter
- Each agent runs in isolated context with restricted tools
- Agent .md files live in `~/.clawforge/agents/` and `./agents/`

## Testing
`tests/agents.test.ts` — load test agent, delegate task, verify tool restrictions

## Common Tasks
- Add a built-in agent: create .md in `agents/` directory
