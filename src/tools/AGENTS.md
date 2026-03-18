# src/tools/

## Purpose
All tool implementations. Each subdirectory is a self-contained module providing one or more MCP tools.

## Integration
Tools are called by MCP handlers (`src/mcp/handlers.ts`) and CLI commands (`src/cli/`).

## Key Files
Each subdirectory contains its own AGENTS.md. See individual directories.

## Dependencies
- **internal**: `src/shared/` for types, config, logger

## Conventions
- Every tool function returns `Promise<ToolResult>`
- Never throw — always return `{ success: false, error: "..." }`
- Use zod for input validation
- Each tool module is independently testable

## Testing
Each module has tests in `tests/<module>.test.ts`

## Common Tasks
- Add a new tool module: create `src/tools/<name>/`, add AGENTS.md, implement, register in MCP + CLI
