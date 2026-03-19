---
name: session-recap
description: Search recent memory, summarize session accomplishments, and store the recap.
version: "1.0.0"
triggers:
  - "session recap"
  - "summarize what we did"
  - "end of session"
  - "what did we accomplish"
  - "recap"
tools_used:
  - memory_search
  - memory_timeline
  - memory_store
  - memory_context
---

# Session Recap

## Workflow

1. **Retrieve recent context**:
   - Call `memory_context` to get the lightweight index of recent activity.
   - Call `memory_search` with query "recent changes decisions features" to find relevant observations.
   - Use `memory_timeline` on the most recent observation ID to get surrounding context.

2. **Organize by category**:
   - Files created or modified
   - Decisions made (why, alternatives considered)
   - Features implemented
   - Bugs fixed
   - Problems encountered and how they were resolved
   - Experiments tried (even if abandoned)

3. **Write the recap**:
   ```
   ## Session Recap — <date>
   **Project**: <project name>
   **Duration**: <estimated>

   ### ✅ Accomplished
   - <item 1>
   - <item 2>

   ### 🔧 Technical Decisions
   - <decision>: chose X over Y because <reason>

   ### 🐛 Fixed
   - <bug description and fix>

   ### 📋 In Progress / Next Steps
   - <unfinished work>
   - <what to pick up next session>

   ### 💡 Notes for Next Time
   - <context that will be useful>
   ```

4. **Store the recap**: `memory_store` with type=decision, title="Session Recap <date>"

5. **Print the recap** to the conversation so the user sees it.

## Notes
- Be specific — "added authentication" is less useful than "implemented JWT auth in src/auth/middleware.ts using jsonwebtoken, tokens expire in 24h"
- Capture the WHY for decisions, not just the WHAT
- Next Steps should be actionable and prioritized
