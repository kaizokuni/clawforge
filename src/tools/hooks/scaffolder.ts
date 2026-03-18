/**
 * Hook scaffolder.
 * Generates a template .md hook file in ~/.clawforge/hooks/.
 */

import fs from "node:fs";
import path from "node:path";
import { HOOKS_DIR } from "../../shared/constants.js";
import { logger } from "../../shared/logger.js";
import type { HookTrigger, ToolResult } from "../../shared/types.js";

const TRIGGER_EXAMPLES: Record<HookTrigger, string> = {
  "pre-commit": "conditions:\n  # No conditions needed for git hooks",
  "pre-push": "conditions:\n  # No conditions needed for git hooks",
  "post-edit": "conditions:\n  file_patterns: \"src/**/*.ts,src/**/*.tsx\"",
  "file-change": "conditions:\n  file_patterns: \"src/**/*.ts\"",
  "on-error": "conditions:\n  # Fires when any shell command exits with non-zero code",
  "on-session-start": "conditions:\n  # Fires when a new Claude Code session begins",
  "on-session-end": "conditions:\n  # Fires when a Claude Code session ends",
  "on-test-fail": "conditions:\n  # Fires when test results include failures",
};

/**
 * Scaffold a new hook template.
 * @param name - Hook name.
 * @param trigger - Trigger type.
 * @param description - Short description.
 * @param outputDir - Override output directory (defaults to HOOKS_DIR).
 * @returns Tool result with the path to the created file.
 */
export function scaffoldHook(
  name: string,
  trigger: HookTrigger = "file-change",
  description: string = "TODO: describe this hook",
  outputDir: string = HOOKS_DIR
): ToolResult {
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${cleanName}.md`);

    if (fs.existsSync(filePath)) {
      return { success: false, error: `Hook already exists: ${filePath}` };
    }

    const conditionsExample = TRIGGER_EXAMPLES[trigger] ?? "conditions: {}";

    const template = `---
name: ${cleanName}
description: ${description}
trigger: ${trigger}
${conditionsExample}
---

# Hook: ${cleanName}

## Action

TODO: Describe what this hook should do when it fires.

When trigger \`${trigger}\` fires:

1. TODO: Add action steps here.
2. Use {{changedFile}} to reference the file that changed (for file-change hooks).
3. Use {{exitCode}} and {{command}} for on-error hooks.

## Notes
- This hook's action prompt is injected as context when the trigger fires.
- Variable interpolation: {{variableName}} is replaced at runtime.
`;

    fs.writeFileSync(filePath, template, "utf-8");
    logger.info("Hook scaffolded", { name: cleanName, trigger, path: filePath });

    return { success: true, data: { name: cleanName, trigger, path: filePath } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Scaffold failed: ${msg}` };
  }
}
