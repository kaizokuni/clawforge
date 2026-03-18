# src/tools/memory/

## Purpose
Persistent vector memory system. Auto-captures observations, compresses via LLM, embeds into vectors, stores in SQLite + sqlite-vec. Progressive 3-layer disclosure for recall.

## Integration
MCP tools: `memory_search`, `memory_timeline`, `memory_get_observations`, `memory_store`, `memory_status`

## Key Files
- `vector-store.ts` — SQLite + sqlite-vec schema, insert, cosine similarity search
- `embedder.ts` — Text → vector (Ollama nomic-embed-text default, OpenAI fallback)
- `observer.ts` — Real-time observation capture from tool calls
- `compressor.ts` — Batch-compress observations via Claude API (~10x reduction)
- `retriever.ts` — 3-layer progressive disclosure: search → timeline → full details
- `injector.ts` — Auto-inject memory context at session start
- `entities.ts` — Extract/track people, projects, preferences from summaries
- `diary.ts` — Daily auto-generated diary entries aggregating summaries

## Dependencies
- **npm**: `better-sqlite3`, `sqlite-vec`, `@anthropic-ai/sdk`, `ollama`
- **internal**: `src/shared/`

## Conventions
- One global DB at `~/.clawforge/data/memory.db`
- Cross-project queries supported
- Embeddings are Float32Array blobs

## Testing
`tests/memory.test.ts` — store → compress → embed → search roundtrip, progressive disclosure

## Common Tasks
- Add a new observation type: update `observer.ts` categories
- Change embedding model: update `embedder.ts` adapter
