# src/tools/skills/

## Purpose
Skills system. Load SKILL.md files, match user intent to skills, execute skill workflows.

## Integration
MCP tools: `skill_run`, `skill_list`, `skill_install`

## Key Files
- `loader.ts` — Discover SKILL.md files, parse YAML frontmatter with gray-matter
- `resolver.ts` — Match user input to skill by name or trigger phrases
- `executor.ts` — Execute skill workflow instructions step by step

## Dependencies
- **npm**: `gray-matter`
- **internal**: `src/shared/`

## Conventions
- Antigravity-compatible SKILL.md format
- Skills can reference any ClawForge tool in their workflow
- Skills loaded from `~/.clawforge/skills/` and `./skills/`

## Testing
`tests/skills.test.ts` — load skill, verify trigger matching, execute mock workflow

## Common Tasks
- Add a built-in skill: create `skills/<name>/SKILL.md`
