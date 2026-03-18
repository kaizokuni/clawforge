# hooks/

## Purpose
Built-in hook definitions. Each .md file defines an automation trigger with conditions and action prompt.

## Integration
Loaded by `src/tools/hooks/loader.ts`. MCP tools: `hook_trigger`, `hook_list`

## Key Files
- `pre-commit-validation.md`, `post-edit-typecheck.md`, `on-error-debug.md`, `on-session-start-context.md`, `on-session-end-save.md`, `file-change-reload.md`, `pre-push-tests.md`, `backup-before-edit.md`

## Common Tasks
- Add a new hook: create `hooks/<name>.md` with frontmatter (name, trigger, conditions) + action body
