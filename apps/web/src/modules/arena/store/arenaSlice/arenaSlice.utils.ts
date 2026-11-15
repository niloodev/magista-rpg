import type { IArenaToken } from "@magista/shared";

/**
 * Inserts or replaces a token, keeping the drawing order (position, then insertion).
 */
export function upsertToken(tokens: IArenaToken[], token: IArenaToken): IArenaToken[] {
  const exists = tokens.some((entry) => entry.id === token.id);
  const next = exists
    ? tokens.map((entry) => (entry.id === token.id ? token : entry))
    : [...tokens, token];
  return [...next].sort((a, b) => a.position - b.position);
}

/**
 * Copy of a record without one key.
 */
export function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key));
}
