---
name: debug-loop
description: Iterative debug cycle — run command, parse error, locate bug, fix, re-run. Max 5 iterations.
version: "1.0.0"
triggers:
  - "debug this"
  - "fix the error"
  - "debug loop"
  - "iteratively fix"
tools_used:
  - memory_search
  - index_search
---

# Debug Loop

## Workflow

Repeat up to **5 iterations** or until the command passes:

### Iteration Steps

1. **Run the failing command** — Execute the test, build, or script that's failing.
   - Capture the full stdout/stderr output.

2. **Parse the error**:
   - Extract: error type, message, file path, line number, stack trace
   - Identify: the root cause vs. downstream symptoms (fix the root)

3. **Locate the bug**:
   - Use `index_search` to find the relevant code: search for the function name, error message keywords, or file path
   - Read the surrounding context (±20 lines)
   - Check: recent changes (`git log --oneline -10`, `git diff`)

4. **Use `memory_search`** to find if this error has been seen before and how it was resolved.

5. **Form a hypothesis** — State clearly what you think the bug is and why.

6. **Apply the fix** — Make the minimal change that addresses the root cause.
   - Prefer: targeted fixes over refactors
   - Document: leave a comment explaining the fix if non-obvious

7. **Re-run the command** — If it passes, done. If it fails, start next iteration.

### After 5 Iterations
If still failing:
- Document what was tried
- Escalate: use `agent_delegate` to hand off to `debug-specialist` agent
- Store findings in memory: `memory_store` with type=bug_fix

## Notes
- Don't treat symptoms — find and fix root causes.
- If the error message is cryptic, `web_search` the exact error string.
- Watch for: environment issues, missing deps, path problems before diving into code.
