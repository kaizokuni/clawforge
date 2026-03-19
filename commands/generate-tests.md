---
name: generate-tests
description: Generate thorough tests for the current file or specified target.
category: testing
---

# /generate-tests

Identify the target file (from context or user's message), detect the test framework, and generate comprehensive tests.

## Steps

1. **Identify the target**: determine which file or function needs tests from the current conversation context.

2. **Detect the framework**: check `package.json`, `pyproject.toml`, or `go.mod` for the test runner (jest, vitest, pytest, go test, rspec, etc).

3. **Read the source**: read the target file completely. Understand:
   - All exported functions, classes, and types
   - Function signatures, parameters, return values
   - Error cases and edge conditions
   - Dependencies that need mocking

4. **Check existing tests**: look for existing test files to match style and conventions.

5. **Generate tests** covering:
   - Happy path (normal inputs → expected outputs)
   - Error paths (what happens when things go wrong)
   - Edge cases (empty, null, max, boundary values)
   - Each exported function/method

6. **Write the test file** at the standard location (`*.test.ts`, `test_*.py`, etc.) with:
   - Descriptive test names
   - Proper setup/teardown
   - Appropriate mocks for external dependencies only

7. **Run the tests** and fix any failures.

8. **Report**: "Added N tests for <file>. Coverage improved from X% to Y%."
