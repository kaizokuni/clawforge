---
name: explain-code
description: Explain selected code in plain language — what it does, how, and why.
category: documentation
---

# /explain-code

Explain the code in the current context clearly and at the right level of detail.

## Steps

1. **Identify the code to explain**: from the user's message, current file, or selection.

2. **Read the full context**: don't explain in isolation — understand the surrounding code, imports, and usage.

3. **Explain at three levels**:

   **What it does** (1-2 sentences, plain English):
   > "This function validates a JWT token and returns the decoded user payload, or throws an error if expired."

   **How it works** (step-by-step walkthrough):
   - Describe each significant section
   - Explain non-obvious logic ("This regex matches ISO 8601 dates because...")
   - Note the data flow (input → transformations → output)

   **Why it exists** (purpose and design choices):
   - Why this approach vs. alternatives?
   - What problem does it solve?
   - Any important constraints it operates under?

4. **Highlight**:
   - Any surprising or tricky parts
   - Potential footguns or gotchas
   - External dependencies and what they do

5. **Adjust depth** based on the user's apparent expertise level.
