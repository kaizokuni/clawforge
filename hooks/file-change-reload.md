---
name: file-change-reload
description: When config or env files change — alert and suggest reloading.
trigger: file-change
conditions:
  file_patterns: "config.*,*.env,.env*,*.yaml,*.yml,*.json"
---

# Hook: file-change-reload

When a configuration or environment file changes, alert the user and suggest appropriate actions.

## Action

The file `{{changedFile}}` was changed.

1. **Identify what changed**:
   - Read the diff of the changed file
   - Determine what configuration values changed

2. **Determine impact based on file type**:
   - `.env` / `.env.*`: environment variables — processes using these need restart
   - `package.json`: dependencies or scripts changed — may need `npm install`
   - `tsconfig.json`: TypeScript config changed — rebuild may be needed
   - `*.yaml` / `*.yml`: application config — the relevant service needs restart
   - `config.*`: application-specific — check what uses this config

3. **Alert the user**:
   ```
   📝 Config changed: {{changedFile}}
   <brief description of what changed>
   Action needed: <restart server | run npm install | rebuild>
   ```

4. **If it's a dependency change** (`package.json`): offer to run `npm install` automatically.

5. **If it's a secrets file** (`.env`): remind the user not to commit it: check `.gitignore`.

## Notes
- Watches common config file patterns — edit `conditions.file_patterns` to customize.
- Does not auto-restart processes (too risky) — just alerts.
