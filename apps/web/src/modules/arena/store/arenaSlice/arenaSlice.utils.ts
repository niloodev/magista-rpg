import type { IArenaToken } from "@magista/shared";

import type { ArenaSelectionMode } from "@/modules/arena/arena.types";

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

/**
 * Next selection after picking tokens: replace it, add to it, or toggle each picked token.
 */
export function nextSelection(
  current: string[],
  picked: string[],
  mode: ArenaSelectionMode,
): string[] {
  if (mode === "replace") return [...new Set(picked)];
  if (mode === "add") return [...new Set([...current, ...picked])];
  const toggled = new Set(current);
  for (const id of picked) {
    if (toggled.has(id)) toggled.delete(id);
    else toggled.add(id);
  }
  return [...toggled];
}
