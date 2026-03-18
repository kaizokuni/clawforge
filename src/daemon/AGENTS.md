# src/daemon/

## Purpose
Background daemon service that keeps ClawForge running between sessions. Manages cron, browser pool, observer, monitor, and hook watchers.

## Integration
`clawforge start` / `clawforge stop` / `clawforge status`

## Key Files
- `service.ts` — Daemon lifecycle: start, stop, status. Runs cron, browser pool, observer, monitor, hooks
- `process.ts` — Platform-specific daemonization (detached child process, PID file)
- `health.ts` — Health check endpoint returning daemon status JSON

## Dependencies
- **internal**: `src/tools/cron/`, `src/tools/browser/`, `src/tools/memory/`, `src/tools/monitor/`, `src/tools/hooks/`

## Conventions
- Graceful shutdown on SIGTERM/SIGINT
- PID file at `~/.clawforge/daemon.pid`
- Logs to `~/.clawforge/logs/daemon.log`

## Testing
- Start daemon, verify PID file created, health check responds, stop cleanly

## Common Tasks
- Add a new background service: register in `service.ts` start/stop lifecycle
