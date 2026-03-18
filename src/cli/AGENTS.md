# src/cli/

## Purpose
Commander.js CLI providing terminal access to all ClawForge features.

## Integration
`clawforge <command>` routes here. One file per subcommand.

## Key Files
- `index.ts` — Commander.js top-level program with all subcommands
- `browser.ts` — `clawforge browser open|screenshot|click|type|evaluate|content`
- `memory.ts` — `clawforge memory search|timeline|store`
- `search.ts` — `clawforge search <query>`
- `design.ts` — `clawforge design preview|iterate`
- `index-cmd.ts` — `clawforge index <directory>`
- `cron.ts` — `clawforge cron schedule|list|remove`
- `skill.ts` — `clawforge skill run|list|install`
- `agent.ts` — `clawforge agent delegate|list|create`
- `mcp.ts` — `clawforge mcp-hub route|list`
- `monitor.ts` — `clawforge monitor [--tunnel]`
- `command.ts` — `clawforge command run|list|create`
- `hook.ts` — `clawforge hook trigger|list|create`
- `settings.ts` — `clawforge settings apply|list`
- `marketplace.ts` — `clawforge marketplace search|install|browse`
- `workflow.ts` — `clawforge workflow run|list|create`
- `init.ts` — `clawforge init` (project setup)
- `setup.ts` — `clawforge setup` (global first-time setup)

## Dependencies
- **npm**: `commander`
- **internal**: `src/tools/*`, `src/shared/`

## Conventions
- Each subcommand is a separate file
- Clean stdout output, errors to stderr
- Exit code 0 on success, 1 on error

## Testing
- Test each command with mock tool modules
- Verify argument parsing and output format

## Common Tasks
- Add a new CLI command: create `<name>.ts`, register in `index.ts`
