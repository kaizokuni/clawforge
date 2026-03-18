# workflows/

## Purpose
Multi-step workflow playbooks. Each .yaml defines ordered steps chaining skills, agents, and commands.

## Integration
Loaded by `src/tools/workflows/loader.ts`. MCP tools: `workflow_run`, `workflow_list`

## Key Files
- `ship-feature.yaml`, `bug-fix.yaml`, `code-review-cycle.yaml`, `new-project.yaml`

## Common Tasks
- Add a new workflow: create `workflows/<name>.yaml` with steps array
