---
name: session-recap
description: Summarize session accomplishments, decisions, and next steps from memory.
category: productivity
---

# /session-recap

Execute the `session-recap` skill to generate a complete summary of what was accomplished this session.

## Steps

1. **Run `skill_run session-recap`** to trigger the full memory-based recap workflow.

2. The skill will:
   - Query `memory_context` for recent activity
   - Search `memory_search` for decisions and changes
   - Use `memory_timeline` for detailed context
   - Organize findings by category
   - Write and display the formatted recap
   - Store the recap in memory for future sessions

3. **Confirm the recap** looks accurate, then ask the user:
   - "Is there anything I missed?"
   - "What's the priority for next session?"

4. **Update the recap** with any additions, then store the final version.
