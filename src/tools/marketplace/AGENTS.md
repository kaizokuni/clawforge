# src/tools/marketplace/

## Purpose
Component marketplace. Browse, search, install, publish components (agents, skills, commands, hooks, etc.).

## Integration
MCP tools: `marketplace_search`, `marketplace_install`

## Key Files
- `registry.ts` — Fetch/cache component index from local JSON registry
- `searcher.ts` — Search/filter by type, keyword, category
- `installer.ts` — Download component, detect type, copy to correct `~/.clawforge/<type>/`
- `stacks.ts` — Batch install from stack definitions
- `browser.ts` — Interactive TUI browser using Ink
- `publisher.ts` — Package local component, add metadata, append to registry
- `validator.ts` — Security checks: scan for dangerous patterns, warn/block

## Dependencies
- **npm**: `ink`, `undici`, `zod`
- **internal**: `src/shared/`

## Conventions
- Local registry at `~/.clawforge/marketplace/registry.json`
- Security validation before every install
- Auto-detect component type from file structure

## Testing
`tests/marketplace.test.ts` — search registry, install mock component, verify correct dir

## Common Tasks
- Add security check: update `validator.ts` pattern list
