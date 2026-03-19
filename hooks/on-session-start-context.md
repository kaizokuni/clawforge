---
name: on-session-start-context
description: At session start — auto-inject recent memory context to resume seamlessly.
trigger: on-session-start
conditions: {}
---

# Hook: on-session-start-context

When a new Claude Code session begins, automatically load relevant memory context.

## Action

1. **Get recent context**: call `memory_context` with projectPath set to the current working directory. Limit to 15 entries.

2. **Format for injection**: present the context as a brief briefing:
   ```
   ## Resuming Project: <project name>

   ### Recent Activity
   <memory context entries>

   ### Last Session
   <most recent session-recap if available>

   ### Open Items
   <any "in progress" or "next steps" observations>
   ```

3. **Check for pending items**:
   - Use `memory_search` query: "in progress TODO next steps blocked"
   - Surface any unfinished work from the previous session

4. **Remind of active settings**: if a settings preset was active last session, mention it.

5. **Print the briefing** at the start of the session so the user sees it immediately.

## Notes
- Keeps the briefing concise — no more than 20 lines.
- Only loads context for the current project path.
- Helps avoid the "what were we doing?" problem at the start of every session.
