# src/tools/mcp-hub/

## Purpose
Meta-MCP router. One connection from Claude Code routes to multiple external MCP servers.

## Integration
MCP tools: `mcp_route`, `mcp_list_servers`

## Key Files
- `registry.ts` — Track connected MCP servers in `~/.clawforge/mcp/servers.json`
- `connector.ts` — Launch child MCP server processes via stdio, manage lifecycle
- `discovery.ts` — Send `tools/list` to child servers, store discovered tools
- `router.ts` — `mcp_route(server, tool, params)` → forward call, return result

## Dependencies
- **npm**: `@modelcontextprotocol/sdk`
- **internal**: `src/shared/`

## Conventions
- Servers registered in JSON config
- Handle process crashes gracefully with auto-restart
- Discovered tools cached in registry

## Testing
`tests/mcp-hub.test.ts` — register mock server, discover tools, route call

## Common Tasks
- Add a default MCP server: update registry defaults in `registry.ts`
