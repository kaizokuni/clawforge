---
name: design-system
description: Generate UI component, preview in browser, screenshot, analyze visually, iterate.
version: "1.0.0"
triggers:
  - "design this UI"
  - "design system"
  - "create component"
  - "build UI"
  - "design preview"
tools_used:
  - design_preview
  - design_iterate
  - browser_screenshot
  - web_search
---

# Design System

## Workflow

### Phase 1 — Requirements
1. Clarify the component: what it is, what it does, who uses it.
2. Identify design constraints: color scheme, fonts, spacing, responsive breakpoints.
3. Use `web_search` to find inspiration or component examples if needed.

### Phase 2 — Generate
1. Write the HTML + CSS for the component.
   - Use CSS custom properties (--color-primary, --spacing-md, etc.) for theming.
   - Make it responsive with media queries.
   - Include hover/focus/active states.

2. Call `design_preview` with the HTML and CSS to render it in the browser.

### Phase 3 — Visual Review
1. Call `browser_screenshot` to capture the rendered component.
2. Analyze the screenshot:
   - Does it match the requirements?
   - Is the layout correct? Spacing balanced? Typography readable?
   - Does it look good on mobile (narrow viewport)?
3. Note specific issues to fix.

### Phase 4 — Iterate
1. Apply the fixes to the HTML/CSS.
2. Call `design_iterate` to capture the updated state.
3. Repeat Phase 3 until satisfied (max 5 iterations).

### Phase 5 — Document
1. Add comments to the CSS explaining design decisions.
2. List the CSS custom properties used (design tokens).
3. Note browser compatibility considerations.

## Notes
- Start simple, iterate to complexity.
- Prefer CSS Grid and Flexbox over absolute positioning.
- Always test at 320px (mobile) and 1440px (desktop) widths.
