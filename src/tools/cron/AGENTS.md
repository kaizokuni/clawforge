# src/tools/cron/

## Purpose
Cron-based task scheduling. Register, persist, and execute recurring tasks.

## Integration
MCP tools: `cron_schedule`, `cron_list`, `cron_remove`

## Key Files
- `scheduler.ts` — Register cron jobs, persist to `~/.clawforge/cron/jobs.json`, use node-cron
- `runner.ts` — Execute shell commands on schedule, log output

## Dependencies
- **npm**: `node-cron`
- **internal**: `src/shared/`

## Conventions
- Jobs persisted as JSON for durability across restarts
- Standard cron syntax (5-field)
- Output logged to `~/.clawforge/logs/cron.log`

## Testing
`tests/cron.test.ts` — schedule job, verify it persists, verify execution

## Common Tasks
- Add a new job type: update `runner.ts` execution logic
