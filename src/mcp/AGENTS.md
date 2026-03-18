# src/mcp/

## Purpose
MCP stdio server that exposes all 35 ClawForge tools to Claude Code.

## Integration
Started via `clawforge mcp`. Claude Code connects via stdio transport.

## Key Files
- `server.ts` — MCP server setup with `@modelcontextprotocol/sdk` stdio transport
- `tools.ts` — Register all 35 tools with MCP schemas (name, description, inputSchema)
- `handlers.ts` — Route each MCP tool call to the correct tool module, handle errors

## Dependencies
- **npm**: `@modelcontextprotocol/sdk`
- **internal**: `src/tools/*`, `src/shared/`

## Conventions
- Never crash the MCP server — wrap all handlers in try/catch
- Return structured `ToolResult` objects
- Tool names use snake_case (e.g., `browser_screenshot`)

## Testing
- Start server, send tool call via stdin, verify JSON-RPC response
- Test each tool handler returns valid ToolResult

## Common Tasks
- Add a new MCP tool: define schema in `tools.ts`, add handler in `handlers.ts`
