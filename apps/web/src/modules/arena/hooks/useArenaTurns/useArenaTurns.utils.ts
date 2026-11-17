import {
  canControlToken,
  type IArenaToken,
  type IArenaTurnOrder,
  type IArenaView,
} from "@magista/shared";

import { ARENA_TURNS_STORAGE_KEY } from "@/modules/arena/arena.constants";
import type { IArenaTurnRow } from "@/modules/arena/arena.types";
import { tokenDisplayName } from "@/modules/arena/arena.utils";

/**
 * Lines of the turn order window: each entry whose token this viewer sees, with its name (as the viewer may read
 * it), portrait and tone, marking the current turn.
 */
export function turnRows(
  view: IArenaView,
  order: IArenaTurnOrder | null,
  rolling: Readonly<Record<string, number>>,
  isGm: boolean,
  mediaUrl: (path: string | null) => string | null,
): IArenaTurnRow[] {
  if (!order) return [];
  const byId = new Map(view.tokens.map((token) => [token.id, token]));
  const viewer = { role: isGm ? ("GM" as const) : ("PLAYER" as const) };
  const listed = new Set(order.entries.map((entry) => entry.tokenId));
  const joining = Object.keys(rolling)
    .filter((tokenId) => !listed.has(tokenId))
    .map((tokenId) => ({ tokenId, initiative: null }));
  const rows = [...order.entries, ...joining].flatMap(
    ({ tokenId, initiative }): IArenaTurnRow[] => {
      const token = byId.get(tokenId);
      if (!token) return [];
      const own = isGm
        ? token.characterId === null
        : canControlToken(viewer, token, view.controllableCharacterIds);
      return [
        {
          id: token.id,
          name: tokenDisplayName(token, isGm),
          imageUrl: mediaUrl(token.imageThumbUrl ?? token.imageUrl),
          style: token.style,
          tone: own ? "own" : "other",
          hidden: token.hidden,
          initiative,
          current: order.currentTokenId === token.id,
          upNext: false,
          rolling: tokenId in rolling,
        },
      ];
    },
  );
  const current = rows.findIndex((row) => row.current);
  const next = current >= 0 && rows.length > 1 ? rows[(current + 1) % rows.length] : undefined;
  return next ? rows.map((row) => (row === next ? { ...row, upNext: true } : row)) : rows;
}

/**
 * Whether two lists of turn rows show the same thing (token moves do not touch the window).
 */
export function sameTurnRows(a: IArenaTurnRow[], b: IArenaTurnRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((row, index) => {
      const other = b[index];
      return (
        other !== undefined &&
        row.id === other.id &&
        row.name === other.name &&
        row.imageUrl === other.imageUrl &&
        row.style === other.style &&
        row.tone === other.tone &&
        row.hidden === other.hidden &&
        row.initiative === other.initiative &&
        row.current === other.current &&
        row.upNext === other.upNext &&
        row.rolling === other.rolling
      );
    })
  );
}

/**
 * A store selector of the turn rows that keeps returning the same list while nothing it shows changed (token
 * moves rebuild the view, not the window).
 */
export function createTurnRowsSelector(
  isGm: boolean,
  mediaUrl: (path: string | null) => string | null,
): (
  view: IArenaView | null,
  order: IArenaTurnOrder | null,
  rolling: Readonly<Record<string, number>>,
) => IArenaTurnRow[] {
  let last: IArenaTurnRow[] = [];
  let inputs: unknown[] = [];
  return (view, order, rolling) => {
    if (inputs[0] === view && inputs[1] === order && inputs[2] === rolling) return last;
    inputs = [view, order, rolling];
    const next = view ? turnRows(view, order, rolling, isGm, mediaUrl) : [];
    if (!sameTurnRows(last, next)) last = next;
    return last;
  };
}

/**
 * The token whose turn it is, when this viewer sees it.
 */
export function currentTurnToken(
  view: IArenaView | null,
  order: IArenaTurnOrder | null,
): IArenaToken | null {
  const current = order?.currentTokenId;
  if (!view || !current) return null;
  return view.tokens.find((token) => token.id === current) ?? null;
}

/**
 * Whether the turn order window was left open on this device.
 */
export function readTurnsOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ARENA_TURNS_STORAGE_KEY) === "open";
  } catch {
    return false;
  }
}

/**
 * Saves whether the turn order window is open on this device (ignored when storage is blocked).
 */
export function saveTurnsOpen(open: boolean): void {
  try {
    window.localStorage.setItem(ARENA_TURNS_STORAGE_KEY, open ? "open" : "closed");
  } catch {
    return;
  }
}
