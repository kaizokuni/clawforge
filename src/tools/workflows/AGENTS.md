# src/tools/workflows/

## Purpose
Multi-step workflow orchestration. Chain skills, agents, and commands into playbooks.

## Integration
MCP tools: `workflow_run`, `workflow_list`

## Key Files
- `loader.ts` — Parse .yaml workflow definitions
- `runner.ts` — Execute steps in sequence, pass context between steps, stop on failure
- `scaffolder.ts` — `clawforge workflow create <name>` generates template

## Dependencies
- **npm**: `yaml`
- **internal**: `src/tools/skills/`, `src/tools/agents/`, `src/tools/commands/`, `src/shared/`

## Conventions
- Workflows are YAML with ordered steps (skill/agent/command + instruction)
- Output of step N becomes input context for step N+1
- Loaded from `~/.clawforge/workflows/` and `./workflows/`

## Testing
`tests/workflows.test.ts` — run 3-step mock workflow, verify all steps execute in order

## Common Tasks
- Add a built-in workflow: create `workflows/<name>.yaml`
