import type { IArenaToken } from "@magista/shared";

import { ARENA_SHEET_WINDOWS_MAX } from "@/modules/arena/arena.constants";
import type { ArenaDockSide, ArenaSelectionMode } from "@/modules/arena/arena.types";

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

/**
 * Puts a sheet window on top of the others, closing the one at the back when more than
 * `ARENA_SHEET_WINDOWS_MAX` are open.
 */
export function withSheetOnTop(openSheets: string[], characterId: string): string[] {
  if (openSheets.at(-1) === characterId) return openSheets;
  const next = [...openSheets.filter((id) => id !== characterId), characterId];
  return next.slice(-ARENA_SHEET_WINDOWS_MAX);
}

/**
 * Slots of the windows still open after `characterId` came to the top: a new window takes the lowest free slot,
 * the others keep theirs.
 */
export function slotsFor(
  openSheets: string[],
  slots: Record<string, number>,
  characterId: string,
): Record<string, number> {
  const kept = Object.fromEntries(
    Object.entries(slots).filter(([id]) => openSheets.includes(id)),
  ) as Record<string, number>;
  if (kept[characterId] !== undefined) return kept;
  const used = new Set(Object.values(kept));
  let slot = 0;
  while (used.has(slot)) slot += 1;
  return { ...kept, [characterId]: slot };
}

/**
 * The docked lists without a sheet (it is moving or closing).
 */
export function withoutDocked(
  docked: Record<ArenaDockSide, string[]>,
  characterId: string,
): Record<ArenaDockSide, string[]> {
  return {
    left: docked.left.filter((id) => id !== characterId),
    right: docked.right.filter((id) => id !== characterId),
  };
}

/**
 * Drops a sheet from the shown docked tabs (the panel goes back to its own tab).
 */
export function clearDockTab(
  dockTab: Record<ArenaDockSide, string | null>,
  characterId: string,
): Record<ArenaDockSide, string | null> {
  return {
    left: dockTab.left === characterId ? null : dockTab.left,
    right: dockTab.right === characterId ? null : dockTab.right,
  };
}
