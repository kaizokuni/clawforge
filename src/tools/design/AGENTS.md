# src/tools/design/

## Purpose
Design preview loop. Generate UI code → render in browser → screenshot → evaluate → iterate.

## Integration
MCP tools: `design_preview`, `design_iterate`

## Key Files
- `previewer.ts` — Save HTML to temp file → open in browser → screenshot → return path
- `iterator.ts` — Take screenshot of preview, return for LLM evaluation

## Dependencies
- **internal**: `src/tools/browser/` (for rendering), `src/shared/`

## Conventions
- Temp files in OS temp dir, cleaned up after idle
- Screenshots saved as PNG

## Testing
`tests/design.test.ts` — preview simple HTML, verify screenshot exists

## Common Tasks
- Add viewport presets: update `previewer.ts` viewport options
