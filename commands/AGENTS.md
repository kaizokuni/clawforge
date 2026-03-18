# commands/

## Purpose
Built-in slash command definitions. Each .md file defines a command with YAML frontmatter + instruction prompt.

## Integration
Loaded by `src/tools/commands/loader.ts`. MCP tools: `command_run`, `command_list`

## Key Files
- `generate-tests.md`, `optimize-bundle.md`, `security-audit.md`, `explain-code.md`, `refactor.md`, `add-docs.md`, `fix-lint.md`, `generate-api-docs.md`, `deploy-checklist.md`, `session-recap.md`

## Common Tasks
- Add a new command: create `commands/<name>.md` with frontmatter (name, description, category) + instruction body
