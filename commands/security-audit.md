---
name: security-audit
description: Run OWASP Top 10 security scan on the codebase and report findings.
category: security
---

# /security-audit

Execute the `security-audit` skill on the current project.

## Steps

1. **Set scope**: audit the current working directory (or the path specified by the user).

2. **Run the security-audit skill**: invoke `skill_run security-audit` with context set to the project root.

3. **Present findings** organized by severity:
   - 🔴 CRITICAL — fix before next deployment
   - 🟠 HIGH — fix in current sprint
   - 🟡 MEDIUM — fix in next sprint
   - 🟢 LOW — best practice improvements

4. **For each finding**: provide:
   - File and line number
   - Description of the vulnerability
   - Proof of concept attack scenario
   - Recommended fix with code example

5. **Offer to fix**: ask which issues the user wants addressed now.

6. **Store report** in memory for future reference.
