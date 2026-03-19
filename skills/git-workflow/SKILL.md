---
name: git-workflow
description: Smart git operations — commit messages, PR summaries, merge conflict resolution.
version: "1.0.0"
triggers:
  - "git workflow"
  - "commit this"
  - "write commit message"
  - "create PR"
  - "PR summary"
  - "resolve conflict"
tools_used:
  - memory_search
  - index_search
---

# Git Workflow

## Workflow

### Mode 1 — Smart Commit Message
1. Run `git diff --staged` to see what's staged.
2. Understand the changes: what was added, changed, removed, and WHY.
3. Write a commit message following Conventional Commits:
   ```
   <type>(<scope>): <short description>

   <body — what changed and why, if non-trivial>

   <footer — breaking changes, closes #issue>
   ```
   Types: feat, fix, docs, style, refactor, test, chore, perf, ci
4. Verify: title ≤72 chars, imperative mood ("add" not "added"), no period at end.

### Mode 2 — PR Description
1. Run `git log main..HEAD --oneline` to list commits in this branch.
2. Run `git diff main...HEAD --stat` to see changed files.
3. Write a PR description:
   ```
   ## Summary
   <2-3 bullet points of what this PR does>

   ## Changes
   - <specific change 1>
   - <specific change 2>

   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing done for <scenario>

   ## Notes
   <anything reviewers should know>
   ```

### Mode 3 — Merge Conflict Resolution
1. Identify conflicting files: `git status` → files with `UU` marker.
2. For each conflict:
   - Read `<<<HEAD` (current branch) and `>>>` (incoming branch) sections
   - Understand what both sides were trying to do
   - Use `index_search` and `memory_search` to understand the intent
   - Merge intelligently — don't just pick one side if both have valid changes
3. After resolving: `git add <file>` and verify the merged code makes sense.
4. Run tests if available.

## Notes
- Always reference issue numbers when available: `closes #123`
- For breaking changes, use `!` or BREAKING CHANGE footer
- Keep commits atomic — one logical change per commit
