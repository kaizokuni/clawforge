---
name: optimize-bundle
description: Analyze bundle size, find heavy dependencies, suggest tree-shaking and splitting.
category: performance
---

# /optimize-bundle

Analyze the project's bundle size and find opportunities to reduce it.

## Steps

1. **Detect the bundler**: check for webpack, vite, rollup, esbuild, parcel, or Next.js config.

2. **Analyze imports** in the source:
   - Find the largest/heaviest imports (lodash, moment, etc.)
   - Look for full library imports where only one function is used: `import _ from 'lodash'` vs. `import { debounce } from 'lodash'`
   - Find duplicate dependencies (same lib, different versions)
   - Find unused imports

3. **Check `package.json`**:
   - Identify packages with no lightweight alternatives
   - Find packages imported in both dependencies and devDependencies

4. **Generate analysis report**:
   ```
   ## Bundle Analysis

   ### Large Dependencies
   | Package | Size | Usage | Alternative |
   |---------|------|-------|-------------|

   ### Quick Wins (tree-shaking)
   - Change `import X from 'lib'` → `import { fn } from 'lib/fn'`

   ### Code Splitting Opportunities
   - <route/feature> could be lazy-loaded

   ### Replacements
   - Replace <heavy-lib> with <lighter-alternative>
   ```

5. **Apply the safe quick wins** (unused import removal, named imports) automatically.

6. **Explain** the code splitting and replacement suggestions without applying them (they require more careful review).
