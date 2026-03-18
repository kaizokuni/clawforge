# src/tools/indexer/

## Purpose
Project indexer for semantic code search. Scans codebase, chunks files, embeds, and stores in sqlite-vec for semantic search.

## Integration
MCP tools: `index_project`, `index_search`

## Key Files
- `scanner.ts` — Recursively scan directory, respect .gitignore, skip node_modules/dist/.git
- `chunker.ts` — Split files into ~500 token chunks with overlap
- `search.ts` — Semantic search: embed query → cosine similarity in project_index table

## Dependencies
- **npm**: `glob`
- **internal**: `src/tools/memory/embedder.ts`, `src/tools/memory/vector-store.ts`, `src/shared/`

## Conventions
- Respect .gitignore patterns
- Chunk overlap prevents losing context at boundaries

## Testing
`tests/indexer.test.ts` — index small directory, search for function name, verify correct file found

## Common Tasks
- Change chunk size: update `chunker.ts` token limit
- Add file type filters: update `scanner.ts`
