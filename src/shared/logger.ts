/**
 * Structured JSON logger.
 * Writes log entries as JSON lines to ~/.clawforge/logs/.
 */

import fs from "node:fs";
import path from "node:path";
import { LOG_DIR } from "./constants.js";
import type { LogLevel, LogEntry } from "./types.js";

/** Numeric priority for log levels. */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class that writes structured JSON to disk and optionally to stderr.
 */
export class Logger {
  private level: LogLevel;
  private logFile: string;
  private initialized: boolean = false;

  /**
   * Create a new Logger instance.
   * @param level - Minimum log level to record.
   * @param logFileName - Name of the log file within LOG_DIR.
   */
  constructor(level: LogLevel = "info", logFileName: string = "clawforge.log") {
    this.level = level;
    this.logFile = path.join(LOG_DIR, logFileName);
  }

  /**
   * Ensure the log directory exists. Called lazily on first write.
   */
  private ensureDir(): void {
    if (this.initialized) return;
    fs.mkdirSync(LOG_DIR, { recursive: true });
    this.initialized = true;
  }

  /**
   * Check whether a given level should be logged.
   * @param level - The level to check.
   * @returns True if the level meets the minimum threshold.
   */
  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  /**
   * Write a log entry to disk and stderr.
   * @param level - Severity level.
   * @param message - Human-readable message.
   * @param context - Optional structured data.
   */
  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context !== undefined ? { context } : {}),
    };

    const line = JSON.stringify(entry) + "\n";

    this.ensureDir();
    try {
      fs.appendFileSync(this.logFile, line, "utf-8");
    } catch {
      // If we can't write to disk, silently continue.
    }

    if (level === "error" || level === "warn") {
      process.stderr.write(`[${level.toUpperCase()}] ${message}\n`);
    }
  }

  /**
   * Log a debug message.
   * @param message - The message.
   * @param context - Optional structured data.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.write("debug", message, context);
  }

  /**
   * Log an info message.
   * @param message - The message.
   * @param context - Optional structured data.
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }

  /**
   * Log a warning.
   * @param message - The message.
   * @param context - Optional structured data.
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, context);
  }

  /**
   * Log an error.
   * @param message - The message.
   * @param context - Optional structured data.
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.write("error", message, context);
  }

  /**
   * Set the minimum log level.
   * @param level - The new minimum level.
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

/** Singleton logger instance for the application. */
export const logger = new Logger();
