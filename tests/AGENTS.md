# tests/

## Purpose
Test suite for all ClawForge modules. One test file per tool module plus integration tests.

## Key Files
- `memory.test.ts`, `browser.test.ts`, `search.test.ts`, `design.test.ts`, `indexer.test.ts`, `agents.test.ts`, `commands.test.ts`, `hooks.test.ts`, `settings.test.ts`, `marketplace.test.ts`, `workflows.test.ts`, `mcp-hub.test.ts`, `monitor.test.ts`, `mcp.test.ts`, `integration.test.ts`

## Conventions
- Each test file tests one module in isolation
- Integration test runs full end-to-end flow

## Common Tasks
- Add tests for a new module: create `tests/<module>.test.ts`
