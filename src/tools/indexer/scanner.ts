/**
 * Project directory scanner.
 * Recursively scan directory, respect .gitignore, skip common exclusions.
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { logger } from "../../shared/logger.js";

/** Default directories to always skip. */
const DEFAULT_IGNORE = [
  "node_modules", "dist", ".git", ".next", "__pycache__",
  ".venv", "venv", ".tox", "build", "target", ".cache",
  "coverage", ".nyc_output", ".turbo",
];

/** Default file extensions to index. */
const INDEXABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
  ".kt", ".scala", ".md", ".json", ".yaml", ".yml", ".toml",
  ".html", ".css", ".scss", ".sql", ".sh", ".bash", ".zsh",
  ".dockerfile", ".tf", ".hcl",
]);

/**
 * Scan a directory for indexable files.
 * @param dirPath - Root directory to scan.
 * @param maxFiles - Maximum files to return.
 * @returns Array of absolute file paths.
 */
export async function scanDirectory(dirPath: string, maxFiles: number = 5000): Promise<string[]> {
  const resolvedDir = path.resolve(dirPath);

  if (!fs.existsSync(resolvedDir)) {
    logger.warn("Directory not found for scanning", { path: resolvedDir });
    return [];
  }

  // Build ignore patterns
  const ignorePatterns = DEFAULT_IGNORE.map(d => `**/${d}/**`);

  // Read .gitignore if present
  const gitignorePath = path.join(resolvedDir, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    const lines = gitignore.split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"));
    ignorePatterns.push(...lines.map(l => `**/${l}`));
  }

  try {
    const files = await glob("**/*", {
      cwd: resolvedDir,
      absolute: true,
      nodir: true,
      ignore: ignorePatterns,
    });

    // Filter by indexable extension
    const indexable = files
      .filter(f => INDEXABLE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .slice(0, maxFiles);

    logger.info("Directory scanned", { path: resolvedDir, totalFiles: files.length, indexableFiles: indexable.length });
    return indexable;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Directory scan failed", { error: msg });
    return [];
  }
}
