# settings/

## Purpose
Built-in settings presets. Each .yaml file defines a permission profile.

## Integration
Loaded by `src/tools/settings/loader.ts`. MCP tools: `settings_apply`, `settings_list`

## Key Files
- `full-access.yaml`, `read-only.yaml`, `ci-mode.yaml`, `security-audit.yaml`, `pair-programming.yaml`

## Common Tasks
- Add a new preset: create `settings/<name>.yaml` with permissions, allowlists, blocklists
