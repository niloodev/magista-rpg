import type {
  IArenaTurnOrder,
  IArenaStatusEntry,
  IArenaToken,
  IArenaTokenStatus,
  IArenaTokenStatusAccess,
  IArenaView,
} from "@magista/shared";

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
 * Inserts or replaces several tokens in one pass (one copy and one sort for the whole batch).
 */
export function upsertTokens(tokens: IArenaToken[], incoming: IArenaToken[]): IArenaToken[] {
  const byId = new Map(incoming.map((token) => [token.id, token]));
  const next = tokens.map((token) => {
    const replacement = byId.get(token.id);
    if (!replacement) return token;
    byId.delete(token.id);
    return replacement;
  });
  return [...next, ...byId.values()].sort((a, b) => a.position - b.position);
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

/**
 * Statuses and permissions after an `arena:status` event: null drops the status, an entry with permissions
 * (GM copy) replaces them too.
 */
export function withStatusEntries(
  view: Pick<IArenaView, "statuses" | "statusAccess">,
  entries: IArenaStatusEntry[],
): Pick<IArenaView, "statuses" | "statusAccess"> {
  const statuses: Record<string, IArenaTokenStatus> = { ...view.statuses };
  const withAccess = entries.some((entry) => entry.access);
  const statusAccess: Record<string, IArenaTokenStatusAccess> | undefined = withAccess
    ? { ...view.statusAccess }
    : view.statusAccess;
  for (const { tokenId, status, access } of entries) {
    if (status) statuses[tokenId] = status;
    else delete statuses[tokenId];
    if (access && statusAccess) statusAccess[tokenId] = access;
  }
  return { statuses, ...(statusAccess ? { statusAccess } : {}) };
}

const sameResource = (a: IArenaTokenStatus["health"], b: IArenaTokenStatus["health"]) =>
  a.current === b.current && a.max === b.max;

/**
 * Whether two statuses carry the same values.
 */
export function sameStatus(a: IArenaTokenStatus, b: IArenaTokenStatus): boolean {
  return sameResource(a.health, b.health) && sameResource(a.sanity, b.sanity);
}

/**
 * Statuses after a character changed: every token of that character whose status is already shown takes the
 * new values. Returns the same object when nothing changed.
 */
export function withCharacterStatus(
  view: Pick<IArenaView, "statuses" | "tokens">,
  characterId: string,
  status: IArenaTokenStatus,
): Record<string, IArenaTokenStatus> {
  let next = view.statuses;
  for (const token of view.tokens) {
    const current = view.statuses[token.id];
    if (token.characterId !== characterId || !current || sameStatus(current, status)) continue;
    if (next === view.statuses) next = { ...view.statuses };
    next[token.id] = status;
  }
  return next;
}

/**
 * Whether two turn orders are the same (the GM gets its own order twice: in the ack and in the broadcast).
 */
export function sameTurnOrder(a: IArenaTurnOrder | null, b: IArenaTurnOrder): boolean {
  return (
    a !== null &&
    a.sceneId === b.sceneId &&
    a.round === b.round &&
    a.currentTokenId === b.currentTokenId &&
    a.entries.length === b.entries.length &&
    a.entries.every((entry, index) => {
      const other = b.entries[index];
      return other?.tokenId === entry.tokenId && other.initiative === entry.initiative;
    })
  );
}
