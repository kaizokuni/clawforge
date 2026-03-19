---
name: pre-push-tests
description: Before pushing — run the full test suite to block broken code reaching remote.
trigger: pre-push
conditions: {}
---

# Hook: pre-push-tests

Before any `git push`, run the full test suite. Block the push if tests fail.

## Action

1. **Run the full test suite** (not just short/fast tests):
   - Node.js: `npm test`
   - Python: `pytest`
   - Go: `go test ./...`

2. **Also run type check** if applicable:
   - TypeScript: `npx tsc --noEmit`

3. **If tests pass** (exit 0): allow the push to proceed.

4. **If tests fail** (exit non-zero):
   - Print the failing tests clearly
   - Block the push (exit 1)
   - Show the command to skip if needed: `git push --no-verify` (use only if intentional)
   - Suggest: fix the failures before pushing

5. **Report push attempt** in memory: `memory_store` with the test results summary.

## Notes
- Runs the FULL suite, not just unit tests — integration tests too.
- Slower than pre-commit by design — the goal is to never push broken code.
- For large test suites, consider parallelization: `npm test -- --maxWorkers=4`
