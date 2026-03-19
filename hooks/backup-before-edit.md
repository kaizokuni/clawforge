---
name: backup-before-edit
description: After significant edits — create a git stash as a safety net.
trigger: post-edit
conditions:
  file_patterns: "src/**/*.ts,src/**/*.js,**/*.py,**/*.go"
---

# Hook: backup-before-edit

After editing source files, create a lightweight git stash as a safety net.

## Action

When `{{changedFile}}` was edited:

1. **Check if there are unstaged changes** worth backing up:
   - Run: `git diff --stat`
   - Skip if: fewer than 5 lines changed, or file is brand new

2. **Create a stash snapshot** (without removing the working tree):
   ```
   git stash create
   ```
   This creates a stash object but keeps the working directory intact.

3. **Log the backup** quietly:
   - Note the stash ref in memory: `memory_store` type=decision, title="Auto-backup before editing {{changedFile}}"
   - Do NOT print anything unless the user asks — this runs silently.

4. **Stash retention**: keep the last 5 auto-backups, remove older ones.

## Recovery
If the user needs to recover:
- List backups: `git stash list`
- Restore a backup: `git stash apply stash@{N}`

## Notes
- This is a safety net, not a substitute for proper commits.
- Runs quietly in the background — doesn't interrupt editing flow.
- Only triggers on source code files, not on config, docs, or test files.
