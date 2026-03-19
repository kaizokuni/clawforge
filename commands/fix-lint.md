---
name: fix-lint
description: Run linter, auto-fix all fixable issues, report remaining manual fixes needed.
category: quality
---

# /fix-lint

Run the project's linter and fix all auto-fixable issues.

## Steps

1. **Detect the linter**: check for ESLint (`.eslintrc*`, `eslint.config.*`), Prettier, Biome, Ruff (Python), golangci-lint, rubocop, etc.

2. **Run auto-fix** where available:
   - ESLint: `npx eslint . --fix`
   - Prettier: `npx prettier --write .`
   - Ruff: `ruff check --fix .`
   - Go: `gofmt -w .`

3. **Capture remaining issues**: run the linter again without `--fix` to get the list of issues that need manual attention.

4. **Fix remaining issues manually** where straightforward:
   - Unused variables → remove or prefix with `_`
   - Missing semicolons → add them
   - Wrong indentation → fix it
   - Import ordering → reorder
   - Simple type errors → correct the type

5. **Report issues that need user input**: anything that requires a design decision (e.g., unused parameter might indicate dead code vs. intentional placeholder).

6. **Final run**: run the linter one more time to confirm 0 errors.

7. **Summary**:
   ```
   ## Lint Fix Summary
   Auto-fixed: N issues
   Manually fixed: M issues
   Remaining (need your input): K issues
   ```
