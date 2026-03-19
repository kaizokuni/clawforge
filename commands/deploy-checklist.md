---
name: deploy-checklist
description: Pre-deployment checklist — tests, lint, security, build verification.
category: devops
---

# /deploy-checklist

Run through the full pre-deployment checklist and block on any failures.

## Checklist

### 1. Tests ✅
- Run the full test suite: `npm test` / `pytest` / `go test ./...`
- **BLOCK if any test fails.**
- Report: N tests passed, 0 failed.

### 2. Type Check ✅ (TypeScript/Python)
- Run: `npx tsc --noEmit` / `mypy .`
- **BLOCK if type errors exist.**

### 3. Lint ✅
- Run: `npx eslint .` / `ruff check .` / `golangci-lint run`
- **BLOCK on errors** (warnings OK).

### 4. Security Scan ✅
- Check `package.json` for known vulnerabilities: `npm audit`
- **BLOCK on critical vulnerabilities.**
- Report high/medium vulnerabilities for awareness.

### 5. Build ✅
- Run: `npm run build` / equivalent
- **BLOCK if build fails.**
- Report: build output size, warnings.

### 6. Environment Variables ✅
- Verify all required env vars are documented
- Confirm no secrets in the codebase: `git grep -i "password\|secret\|api_key" -- '*.ts' '*.js' '*.py'`
- **WARN if any found.**

### 7. Database Migrations ✅
- Check for pending migrations
- Confirm migrations are backward-compatible (no destructive column drops on live data)

### 8. Feature Flags ✅
- List any feature flags that are active — confirm they're intentional for this deployment.

## Result
```
Deploy Checklist: ✅ PASS / ❌ BLOCK

Tests:       ✅ 142 passed
Types:       ✅ 0 errors
Lint:        ✅ 0 errors
Security:    ⚠️  2 high vulnerabilities (not blocking)
Build:       ✅ 2.3MB bundle
Env Vars:    ✅ All documented
Migrations:  ✅ None pending

Ready to deploy: YES / NO
```
