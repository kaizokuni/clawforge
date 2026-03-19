---
name: on-error-debug
description: When a shell command fails — automatically delegate to debug-specialist agent.
trigger: on-error
conditions: {}
---

# Hook: on-error-debug

When a shell command exits with a non-zero exit code, automatically start the debug process.

## Action

The failed command was: `{{command}}`
Exit code: `{{exitCode}}`

1. **Capture context**:
   - The command that failed
   - The full error output (from the shell result)
   - Recent file changes: `git diff --stat HEAD~1`

2. **Quick diagnosis** — check the most common causes:
   - Exit code 1: generic failure — read the error message
   - Exit code 127: command not found → check PATH, installed tools
   - Exit code 2: misuse of command/shell built-in
   - Exit code 130: terminated by Ctrl+C — not an error, skip
   - Exit code 137: OOM killed → reduce memory usage

3. **If the error is obvious and simple** (missing dependency, wrong path): fix it immediately.

4. **If the error needs deeper investigation**: use `agent_delegate` to hand off to `debug-specialist` with the error context pre-filled.

5. **Store the error** in memory with `memory_store` type=bug_fix for future reference.

## Notes
- Does NOT fire on exit code 130 (Ctrl+C) or 0 (success).
- Designed to catch test failures, build errors, and script crashes.
