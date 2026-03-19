---
name: security-audit
description: OWASP Top 10 security audit — index codebase, search for vulnerabilities, report findings.
version: "1.0.0"
triggers:
  - "security audit"
  - "audit security"
  - "find vulnerabilities"
  - "OWASP scan"
  - "check for security issues"
tools_used:
  - index_search
  - memory_search
  - web_search
---

# Security Audit

## Workflow

### Phase 1 — Index the Codebase
1. Run `index_project` on the target directory to ensure it's indexed.
2. Identify: entry points, authentication code, database queries, file I/O, external calls.

### Phase 2 — OWASP Top 10 Checks

**A01 — Broken Access Control**
- `index_search`: "authorization role permission admin"
- Check: are all routes protected? Is auth middleware applied consistently?
- Look for: direct object references (user IDs in URLs without auth checks)

**A02 — Cryptographic Failures**
- `index_search`: "password hash crypto encrypt MD5 SHA1 base64"
- Check: no MD5/SHA1 for passwords, using bcrypt/argon2, secrets not hardcoded
- Look for: plain text passwords, weak keys, HTTP vs HTTPS

**A03 — Injection**
- `index_search`: "query sql execute eval exec shell"
- Check: parameterized queries, no string concatenation in SQL, sanitized inputs
- Look for: raw SQL strings, template literal queries, `eval()`, shell injection

**A04 — Insecure Design**
- `index_search`: "rate limit timeout retry"
- Check: rate limiting on auth endpoints, input size limits, business logic validation

**A05 — Security Misconfiguration**
- `index_search`: "cors origin debug development config env"
- Check: CORS not wildcard in prod, debug mode off, default creds changed

**A06 — Vulnerable Components**
- Run: check `package.json` / `requirements.txt` for known vulnerable versions
- `web_search` for CVEs in major dependencies

**A07 — Authentication Failures**
- `index_search`: "login session token cookie jwt"
- Check: session fixation, token expiry, secure+httpOnly cookies, MFA

**A08 — Integrity Failures**
- `index_search`: "deserialize pickle json.parse eval"
- Check: untrusted deserialization, integrity checks on downloaded assets

**A09 — Logging Failures**
- `index_search`: "logger log console.log error"
- Check: auth events logged, sensitive data NOT logged, log injection prevention

**A10 — SSRF**
- `index_search`: "fetch axios request url http"
- Check: user-supplied URLs validated/allowlisted, no internal network requests

### Phase 3 — Report

```
## Security Audit Report
**Date**: <date>
**Scope**: <directory/project>

### 🔴 Critical
- <vuln>: <file:line> — <description and fix>

### 🟠 High
- <vuln>: <file:line> — <description and fix>

### 🟡 Medium
- <finding>

### 🟢 Low / Informational
- <finding>

### ✅ Passed
- <what's done right>

### Recommendations
1. <prioritized action>
```

Store report: `memory_store` type=decision, title="Security Audit <project> <date>"
