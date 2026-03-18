# src/

## Purpose
Root source directory for ClawForge. Contains all TypeScript source code organized by concern.

## Integration
Entry point `index.ts` routes to MCP server or CLI based on arguments.

## Key Files
- `index.ts` — Entry point: parses args, routes to MCP or CLI mode

## Dependencies
- `shared/` — Types, config, logger, constants, platform utils

## Conventions
- TypeScript strict mode, no `any`
- ESM imports with `.js` extensions
- JSDoc on every public function

## Testing
Run `npx tsc --noEmit` to verify all source compiles.

## Common Tasks
- Add a new CLI command: create file in `cli/`, register in CLI index
- Add a new tool: create module in `tools/<name>/`, register in MCP tools
