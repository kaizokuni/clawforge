# src/tools/search/

## Purpose
Web search and page fetching. Search via DuckDuckGo, fetch full pages, extract readable content, summarize.

## Integration
MCP tools: `web_search`, `web_fetch`

## Key Files
- `engine.ts` — DuckDuckGo HTML scraping, parse results with cheerio
- `fetcher.ts` — Fetch any URL with undici, extract readable article via Readability + cheerio
- `summarizer.ts` — Claude API call to summarize fetched content into key points

## Dependencies
- **npm**: `cheerio`, `undici`, `@mozilla/readability`, `@anthropic-ai/sdk`
- **internal**: `src/shared/`

## Conventions
- Respect robots.txt and rate limiting
- Return structured results `{title, snippet, url}[]`
- Summarizer is optional — raw content returned if LLM unavailable

## Testing
`tests/search.test.ts` — search for "Node.js 22", fetch a result, verify content extraction

## Common Tasks
- Add a new search engine: create adapter in `engine.ts`
