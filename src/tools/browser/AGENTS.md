# src/tools/browser/

## Purpose
Playwright-based browser automation. Launch Chromium, navigate, click, type, screenshot, scrape, evaluate JS.

## Integration
MCP tools: `browser_open`, `browser_screenshot`, `browser_click`, `browser_type`, `browser_evaluate`, `browser_content`

## Key Files
- `controller.ts` — Launch/manage Playwright Chromium lifecycle, graceful shutdown
- `actions.ts` — `navigate()`, `click()`, `type()`, `scroll()`, `select()`, `waitForSelector()`
- `capture.ts` — `screenshot()` → PNG, `content()` → readable text via Readability, `pdf()`
- `pool.ts` — Reuse browser instances, max 1 browser, auto-close after 5min idle

## Dependencies
- **npm**: `playwright`, `@mozilla/readability`, `cheerio`
- **internal**: `src/shared/`

## Conventions
- Headless by default, configurable via config
- Always close pages after use
- Screenshots saved to temp dir, return file path

## Testing
`tests/browser.test.ts` — navigate to example.com, screenshot, extract content, click link

## Common Tasks
- Add a new browser action: add to `actions.ts`, register MCP tool in `src/mcp/tools.ts`
