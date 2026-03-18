# src/shared/

## Purpose
Shared types, configuration, logging, constants, and cross-platform utilities used by all other modules.

## Integration
Imported by every module in the project. No tool or CLI command — purely foundational.

## Key Files
- `types.ts` — All TypeScript interfaces (Tool I/O, MCP messages, Memory, Config, Components, Browser, Cron, Monitor)
- `config.ts` — Load/save `~/.clawforge/config.yaml` with zod validation and defaults
- `logger.ts` — Structured JSON logger writing to `~/.clawforge/logs/`
- `constants.ts` — Paths (CLAWFORGE_HOME, DB_PATH, etc.), port numbers, limits, version
- `platform.ts` — OS detection, path normalization, cross-platform helpers

## Dependencies
- **npm**: `zod`, `yaml`
- **node**: `fs`, `path`, `os`

## Conventions
- All types are defined here, not scattered across modules
- Config uses zod schemas with sensible defaults
- Logger is a singleton — import `{ logger }` from anywhere
- All paths use `path.join()`, never hardcoded slashes

## Testing
- `npx tsc --noEmit` — type check
- Config: verify default creation and yaml round-trip
- Logger: verify JSON line output format

## Common Tasks
- Add a new config section: add to `ConfigSchema` in `types.ts`, update `config.ts` defaults
- Add a new constant: add to `constants.ts`
- Add a new type: add to `types.ts` in the appropriate section
