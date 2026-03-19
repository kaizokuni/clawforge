---
name: add-docs
description: Generate JSDoc/docstrings for all undocumented public functions.
category: documentation
---

# /add-docs

Add missing documentation to all public functions in the current file or project.

## Steps

1. **Identify scope**: current file, or a directory if the user specifies.

2. **Find undocumented exports**: scan for `export function`, `export class`, `export const` (for functions), `def `, `func ` etc. that have no preceding docstring/JSDoc comment.

3. **For each undocumented item**, generate appropriate documentation:

   **TypeScript/JavaScript (JSDoc)**:
   ```typescript
   /**
    * Brief description of what this function does.
    * @param name - Description of the parameter.
    * @param options - Configuration options.
    * @returns Description of what is returned.
    * @throws {ErrorType} When this specific condition occurs.
    * @example
    * const result = myFunction('input', { flag: true });
    */
   ```

   **Python (Google style)**:
   ```python
   """Brief description.

   Args:
       param: Description.

   Returns:
       Description.

   Raises:
       ValueError: When this happens.
   """
   ```

4. **Rules**:
   - Document the WHAT and WHY, not the HOW (the code shows the how)
   - Include `@param` for every parameter
   - Include `@returns` if the function returns a value
   - Include `@throws` for documented error cases
   - Add a brief `@example` for non-obvious functions
   - Do NOT document internal/private functions unless they are complex

5. **Apply docs** to the file in-place.

6. **Report**: "Added docs to N functions in <file>."
