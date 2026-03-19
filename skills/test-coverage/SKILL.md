---
name: test-coverage
description: Detect test framework, run tests, identify uncovered code, generate missing tests, re-run.
version: "1.0.0"
triggers:
  - "test coverage"
  - "generate tests"
  - "improve test coverage"
  - "write tests"
  - "add tests"
tools_used:
  - index_search
  - memory_search
---

# Test Coverage

## Workflow

### Phase 1 — Detect Framework
1. Check `package.json` / `pyproject.toml` / `go.mod` for test dependencies.
2. Look for: jest, vitest, mocha, pytest, go test, rspec, etc.
3. Find existing test files to understand conventions:
   - File naming: `*.test.ts`, `*.spec.ts`, `test_*.py`, `*_test.go`
   - Test structure: describe/it/expect vs test/assert
   - Mocking approach: jest.mock, sinon, pytest fixtures

### Phase 2 — Run Tests
1. Run the test command (e.g., `npm test`, `pytest`, `go test ./...`).
2. Capture the output: pass/fail counts, error messages, coverage report.

### Phase 3 — Identify Gaps
1. Use `index_search` to find functions/classes with no corresponding test.
   - Search for exported functions, then check if they appear in test files.
2. Review coverage report if available — look for lines/branches < 80%.
3. Prioritize: business logic > utility functions > configuration.

### Phase 4 — Generate Tests
For each untested function/module:
1. Read the function: understand inputs, outputs, side effects, error paths.
2. Write tests covering:
   - **Happy path**: normal inputs → expected outputs
   - **Edge cases**: empty input, null, zero, max values
   - **Error cases**: invalid input, what errors are thrown
   - **Boundary conditions**: off-by-one, type coercion
3. Follow the existing test style (same describe/it structure, same mock approach).

### Phase 5 — Verify
1. Run tests again.
2. Compare coverage before and after.
3. Fix any test failures caused by the new tests (often reveals real bugs).

### Phase 6 — Report
```
## Test Coverage Report
**Framework**: <jest/pytest/etc>
**Before**: X% coverage, Y passing, Z failing
**After**: X% coverage, Y passing, Z failing
**Tests Added**: N new test cases
**Files covered**: <list>
```

## Notes
- Don't test implementation details — test behavior.
- One assertion per test where possible.
- Tests should be fast (<100ms each) and isolated (no shared state).
