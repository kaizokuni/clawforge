---
name: research
description: Multi-query web research — search, fetch top results, synthesize findings into a report.
version: "1.0.0"
triggers:
  - "research"
  - "look this up"
  - "find information about"
  - "investigate"
  - "what is the best way to"
tools_used:
  - web_search
  - web_fetch
  - memory_search
  - memory_store
---

# Research

## Workflow

### Phase 1 — Query Planning
1. Identify the core question to answer.
2. Break it into 3-5 targeted search queries covering different angles:
   - The main topic
   - Comparison/alternatives
   - Best practices / pitfalls
   - Recent developments (add "2024" or "2025")
   - Stack Overflow / GitHub discussions for practical experience

### Phase 2 — Search
1. Run each query with `web_search`.
2. For each result set, identify the 2-3 most relevant URLs.
3. Prioritize: official docs > reputable tech blogs > StackOverflow > random articles.

### Phase 3 — Fetch and Read
1. Use `web_fetch` to get the full content of the top 3-5 URLs.
2. For each page, extract:
   - Key facts and conclusions
   - Code examples (if relevant)
   - Caveats and warnings
   - Version/date of the information

### Phase 4 — Cross-reference with Memory
1. Use `memory_search` to find if this topic has been researched before.
2. Combine new findings with prior knowledge.

### Phase 5 — Synthesize
1. Write a structured report:
   ```
   ## Research: <topic>

   ### Summary (2-3 sentences)

   ### Key Findings
   - <finding 1> (source: URL)
   - <finding 2>

   ### Recommendation
   <clear actionable conclusion>

   ### Caveats / Open Questions
   - <anything uncertain>

   ### Sources
   - [Title](URL) — <one-line summary>
   ```

2. Store the report: `memory_store` type=discovery, title="Research: <topic>"

## Notes
- Prioritize recent information — web technologies change fast.
- Verify facts from at least 2 independent sources before including.
- Include the date of research in the stored memory.
