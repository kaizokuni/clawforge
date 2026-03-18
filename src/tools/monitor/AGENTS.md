# src/tools/monitor/

## Purpose
Session monitoring dashboard. Track tokens, cost, observations. Web UI + TUI + REST API.

## Integration
MCP tools: `monitor_status`, `monitor_cost`. Web UI at `:19877`. CLI: `clawforge monitor`.

## Key Files
- `tracker.ts` — Per-session metrics: tokens in/out, cost, duration, observation count
- `api.ts` — REST endpoints: `/api/sessions`, `/api/cost`, `/api/live` (SSE)
- `web-ui.ts` — Express server at :19877, serves dashboard.html
- `dashboard.html` — Single-page vanilla JS dashboard with live activity, stats, memory browser
- `tui.ts` — Ink-based terminal dashboard

## Dependencies
- **npm**: `express`, `ink`
- **internal**: `src/shared/`, `src/tools/memory/`

## Conventions
- Dashboard auto-refreshes via SSE
- Cost calculated from model pricing tables
- Optional Cloudflare Tunnel via `--tunnel` flag

## Testing
`tests/monitor.test.ts` — track mock session, verify API returns correct stats

## Common Tasks
- Add a new dashboard section: update `dashboard.html` and `api.ts`
