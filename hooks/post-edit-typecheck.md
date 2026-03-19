---
name: post-edit-typecheck
description: After editing TypeScript files — run tsc to catch type errors immediately.
trigger: post-edit
conditions:
  file_patterns: "**/*.ts,**/*.tsx"
---

# Hook: post-edit-typecheck

After any `.ts` or `.tsx` file is saved, run the TypeScript compiler to catch type errors early.

## Action

When the edited file is `{{changedFile}}`:

1. **Run type check** on the affected area:
   ```
   npx tsc --noEmit
   ```

2. **If type errors exist**:
   - Show the errors with file and line references
   - Explain each error in plain terms
   - Suggest the fix

3. **If no errors**: silently pass (don't spam the user on every save).

4. **Watch for common TypeScript errors**:
   - TS2345: argument type mismatch → check the function signature
   - TS2339: property doesn't exist → check the type definition
   - TS2322: type assignment mismatch → check if types are compatible
   - TS7006: implicit any → add explicit type annotation

## Notes
- Runs in the background — doesn't block editing.
- Only triggers on `.ts`/`.tsx` files, not on `.js` or config files.
