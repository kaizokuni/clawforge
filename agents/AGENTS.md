# agents/

## Purpose
Built-in sub-agent definitions. Each .md file defines an agent with YAML frontmatter + system prompt.

## Integration
Loaded by `src/tools/agents/loader.ts`. MCP tools: `agent_delegate`, `agent_list`

## Key Files
- `frontend-designer.md`, `backend-architect.md`, `security-auditor.md`, `code-reviewer.md`, `debug-specialist.md`, `test-engineer.md`, `devops.md`, `researcher.md`

## Common Tasks
- Add a new agent: create `agents/<name>.md` with frontmatter (name, description, tools, model) + system prompt body
