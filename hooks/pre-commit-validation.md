---
name: pre-commit-validation
description: Before each commit — run lint and tests to block bad commits.
trigger: pre-commit
conditions: {}
---

# Hook: pre-commit-validation

When a git commit is about to be made, validate the code quality first.

## Action

1. **Run the linter** to catch style and error issues:
   - Node.js: `npx eslint . --max-warnings 0`
   - Python: `ruff check .`
   - Go: `golangci-lint run`

2. **Run tests** to ensure nothing is broken:
   - Node.js: `npm test -- --passWithNoTests`
   - Python: `pytest --tb=short -q`
   - Go: `go test ./... -short`

3. **If lint or tests fail**:
   - Print the errors clearly
   - Block the commit (exit with non-zero)
   - Suggest: `git stash` to save work, then fix issues

4. **If all pass**: allow the commit to proceed (exit 0).

## Notes
- Uses `--short` or equivalent flags to keep pre-commit fast (<30s).
- Type checking (tsc) can be added but is usually too slow for pre-commit — use CI instead.
