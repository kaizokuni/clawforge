# src/tools/hooks/

## Purpose
Automation hook system. Fire actions on triggers: pre-commit, post-edit, on-error, file-change, etc.

## Integration
MCP tools: `hook_trigger`, `hook_list`

## Key Files
- `loader.ts` — Discover .md files, parse frontmatter with trigger/conditions
- `watcher.ts` — Event listener manager: git hooks, chokidar file watchers, shell error hooks
- `executor.ts` — When trigger matches: load hook's action prompt, execute, log result
- `scaffolder.ts` — `clawforge hook create <name>` generates template

## Dependencies
- **npm**: `gray-matter`, `chokidar`
- **internal**: `src/shared/`

## Conventions
- Hooks are markdown with YAML frontmatter (name, trigger, conditions)
- Triggers: pre-commit, post-edit, on-error, on-session-start, on-session-end, file-change, pre-push, on-test-fail
- Loaded from `~/.clawforge/hooks/` and `./hooks/`

## Testing
`tests/hooks.test.ts` — register file-change hook, simulate edit, verify hook fires

## Common Tasks
- Add a new trigger type: update `watcher.ts` event listeners
