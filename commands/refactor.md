---
name: refactor
description: Analyze code and suggest/apply targeted refactoring improvements.
category: quality
---

# /refactor

Analyze the target code and apply focused refactoring improvements.

## Steps

1. **Identify the refactoring target** from the user's message or current file.

2. **Analyze for these issues** (in order of priority):
   - **Clarity**: unclear names, long functions (>30 lines), deep nesting (>3 levels)
   - **Duplication**: copy-pasted code that could be extracted
   - **Complexity**: overly complex conditionals that could be simplified
   - **Coupling**: code that knows too much about other modules
   - **Single responsibility**: functions/classes doing too many things

3. **Propose improvements** before making changes:
   ```
   ## Proposed Refactoring

   1. Extract `validateInput()` from `processRequest()` — it has a distinct responsibility
   2. Replace nested ternaries with a lookup table
   3. Rename `d` → `userDocument` for clarity

   Apply all? Or select specific ones?
   ```

4. **Apply approved changes** with these constraints:
   - Do NOT change behavior — refactoring only
   - Keep existing tests passing
   - Maintain the same public API
   - One change at a time (easier to review)

5. **Verify**: run tests after refactoring to confirm nothing broke.

6. **Document**: explain what changed and why in a brief summary.

## Refactoring is NOT
- Adding new features
- Changing behavior
- Rewriting from scratch
- Applying a different architecture pattern
