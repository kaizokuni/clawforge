# src/tools/commands/

## Purpose
Slash command system. Load command .md files, execute instruction prompts.

## Integration
MCP tools: `command_run`, `command_list`

## Key Files
- `loader.ts` — Discover .md files, parse YAML frontmatter
- `executor.ts` — Execute command instruction prompt
- `scaffolder.ts` — `clawforge command create <name>` generates template

## Dependencies
- **npm**: `gray-matter`
- **internal**: `src/shared/`

## Conventions
- Commands are markdown with YAML frontmatter (name, description, category)
- Loaded from `~/.clawforge/commands/` and `./commands/`

## Testing
`tests/commands.test.ts` — load command, execute against mock file

## Common Tasks
- Add a built-in command: create `commands/<name>.md`
