---
name: code-review
description: Review git diff for quality, patterns, and bugs. Generates structured review comments.
version: "1.0.0"
triggers:
  - "review my code"
  - "code review"
  - "review changes"
  - "review this PR"
tools_used:
  - index_search
  - memory_search
  - web_search
---

# Code Review

## Workflow

1. **Get the diff** — Run `git diff HEAD~1` or `git diff --staged` to see what changed.

2. **For each changed file**:
   - Read the full file context around the changed lines
   - Check for: logic errors, off-by-one, null dereference, missing error handling
   - Check for: code style inconsistencies, naming conventions
   - Check for: security issues (input validation, SQL injection, XSS, hardcoded secrets)
   - Check for: performance issues (N+1 queries, unnecessary loops, large allocations)
   - Check for: test coverage — are new functions tested?

3. **Use `index_search`** to find related code: how similar patterns are handled elsewhere in the codebase.

4. **Use `memory_search`** to recall previous review decisions and patterns from past sessions.

5. **Generate review output** in this format:
   ```
   ## Review: <filename>

   ### ✅ Good
   - <what's done well>

   ### ⚠️ Issues
   - **[CRITICAL]** Line X: <description and fix>
   - **[WARN]** Line Y: <description>
   - **[STYLE]** Line Z: <suggestion>

   ### 💡 Suggestions
   - <optional improvements>
   ```

6. **Summary** — Provide an overall verdict: APPROVE / REQUEST CHANGES / NEEDS DISCUSSION.

## Notes
- Focus on correctness first, then security, then style.
- If unsure about a pattern, use `web_search` to check best practices.
- Be constructive — explain the why for each issue.
