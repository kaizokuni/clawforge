# src/tools/settings/

## Purpose
Permission presets. Apply profiles that enable/disable tools at runtime.

## Integration
MCP tools: `settings_apply`, `settings_list`

## Key Files
- `loader.ts` — Discover .yaml files, parse permission definitions
- `applier.ts` — Apply preset at runtime, update tool permission map
- `validator.ts` — Validate preset against available tools, warn on unknowns

## Dependencies
- **npm**: `yaml`, `zod`
- **internal**: `src/shared/`

## Conventions
- Presets are YAML with permissions, allowlists, blocklists
- Loaded from `~/.clawforge/settings/` and `./settings/`
- Disabled tools return structured error, never crash

## Testing
`tests/settings.test.ts` — apply read-only, attempt write, verify blocked

## Common Tasks
- Add a new preset: create `settings/<name>.yaml`
