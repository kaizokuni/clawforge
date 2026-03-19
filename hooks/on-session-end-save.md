---
name: on-session-end-save
description: At session end — automatically save a session summary to memory.
trigger: on-session-end
conditions: {}
---

# Hook: on-session-end-save

When a Claude Code session ends, save a summary of what was accomplished.

## Action

1. **Collect session data**: query `memory_context` for recent observations from this session.

2. **Generate a compact summary**:
   - Files created or modified (list)
   - Key decisions made
   - Problems solved
   - Next steps (any open items)

3. **Store the summary**: `memory_store`
   - type: decision
   - title: "Session End — <date> — <project>"
   - content: the formatted summary

4. **Update CLAUDE.md** in the project directory (if it exists) by appending a brief entry to the activity log section.

5. **Print confirmation**: "Session saved to memory. Resume any time with `clawforge start`."

## Notes
- Runs silently in the background — doesn't interrupt the user.
- The stored summary is retrievable by `on-session-start-context` next time.
- Compresses the session into <500 tokens for efficient future retrieval.
