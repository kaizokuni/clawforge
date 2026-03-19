/**
 * Active session registry.
 * Holds the current MCP session ID so handlers can record usage.
 */

let _currentSessionId: string | null = null;

/** Set the active session ID (called once on MCP server start). */
export function setCurrentSession(id: string): void {
  _currentSessionId = id;
}

/** Get the active session ID, or null if not set. */
export function getCurrentSession(): string | null {
  return _currentSessionId;
}

/**
 * Estimate token count from a string (rough: 4 chars ≈ 1 token).
 * @param text - Input text.
 * @returns Estimated token count.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
