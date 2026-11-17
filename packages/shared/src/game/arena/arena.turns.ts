import type { IArenaTurnEntry, IArenaTurnOrder } from "../../schemas/arena";
import { D20 } from "../rules/rules.constants";
import { joinExpression } from "../rules/rules.utils";
import { canControlToken } from "./arena";
import type { IArenaControlledToken, IArenaControlViewer, IArenaTurnPointer } from "./arena.types";

const ranksBefore = (value: number, other: number | null) => other === null || other < value;

/**
 * Applies new or updated entries to a turn order. An entry with a value goes to its place in descending order
 * (after the entries with the same value, so ties keep who came first); one without a value keeps its place, or
 * goes to the end when it is new.
 */
export function placeTurnEntries(
  entries: readonly IArenaTurnEntry[],
  updates: readonly IArenaTurnEntry[],
): IArenaTurnEntry[] {
  const list = [...entries];
  for (const update of updates) {
    const index = list.findIndex((entry) => entry.tokenId === update.tokenId);
    if (update.initiative === null) {
      if (index >= 0) list[index] = update;
      else list.push(update);
      continue;
    }
    if (index >= 0) list.splice(index, 1);
    const value = update.initiative;
    const at = list.findIndex((entry) => ranksBefore(value, entry.initiative));
    list.splice(at < 0 ? list.length : at, 0, update);
  }
  return list;
}

/**
 * Sorts a turn order by initiative, highest first, entries without a value last (ties keep their order).
 */
export function sortTurnEntries(entries: readonly IArenaTurnEntry[]): IArenaTurnEntry[] {
  const rank = (entry: IArenaTurnEntry) => entry.initiative ?? Number.NEGATIVE_INFINITY;
  return [...entries].sort((a, b) => rank(b) - rank(a));
}

/**
 * Moves an entry to another index of the order (clamped to the list).
 */
export function moveTurnEntry(
  entries: readonly IArenaTurnEntry[],
  tokenId: string,
  index: number,
): IArenaTurnEntry[] {
  const from = entries.findIndex((entry) => entry.tokenId === tokenId);
  if (from < 0) return [...entries];
  const list = [...entries];
  const moved = list.splice(from, 1);
  list.splice(Math.min(Math.max(index, 0), list.length), 0, ...moved);
  return list;
}

/**
 * Passes the turn forward (`1`) or back (`-1`). Forward from the last entry wraps to the first and starts a new
 * round; back from the first goes to the last of the previous round (never below round 1). Without a current
 * turn, forward starts at the first entry and back at the last.
 */
export function advanceTurn(
  order: Pick<IArenaTurnOrder, "entries" | "round" | "currentTokenId">,
  direction: 1 | -1,
): IArenaTurnPointer {
  const { entries, round } = order;
  const first = entries[0];
  const last = entries[entries.length - 1];
  if (!first || !last) return { round, currentTokenId: null };
  const index = entries.findIndex((entry) => entry.tokenId === order.currentTokenId);
  if (index < 0) return { round, currentTokenId: (direction === 1 ? first : last).tokenId };
  const next = entries[index + direction];
  if (next) return { round, currentTokenId: next.tokenId };
  return direction === 1
    ? { round: round + 1, currentTokenId: first.tokenId }
    : { round: Math.max(round - 1, 1), currentTokenId: last.tokenId };
}

/**
 * Removes entries from a turn order. When the current turn is removed it passes to the next entry left (wrapping
 * into a new round), or to nobody when the order is empty.
 */
export function removeTurnEntries(
  order: Pick<IArenaTurnOrder, "entries" | "round" | "currentTokenId">,
  tokenIds: readonly string[],
): IArenaTurnPointer & { entries: IArenaTurnEntry[] } {
  const removed = new Set(tokenIds);
  const entries = order.entries.filter((entry) => !removed.has(entry.tokenId));
  const current = order.currentTokenId;
  if (current === null || !removed.has(current)) {
    return { entries, round: order.round, currentTokenId: current };
  }
  const index = order.entries.findIndex((entry) => entry.tokenId === current);
  const after = order.entries.slice(index + 1).find((entry) => !removed.has(entry.tokenId));
  if (after) return { entries, round: order.round, currentTokenId: after.tokenId };
  return {
    entries,
    round: entries.length > 0 ? order.round + 1 : order.round,
    currentTokenId: entries[0]?.tokenId ?? null,
  };
}

/**
 * The turn order a viewer sees: without the entries of tokens they cannot see, and without the current turn when
 * it belongs to one of them.
 */
export function visibleTurnOrder(
  order: IArenaTurnOrder,
  visibleTokenIds: ReadonlySet<string>,
): IArenaTurnOrder {
  const current = order.currentTokenId;
  return {
    ...order,
    currentTokenId: current !== null && visibleTokenIds.has(current) ? current : null,
    entries: order.entries.filter((entry) => visibleTokenIds.has(entry.tokenId)),
  };
}

/**
 * Whether a viewer may end the current turn: the GM always, a player when the token of the turn is theirs.
 */
export function canEndTurn(
  viewer: IArenaControlViewer,
  order: Pick<IArenaTurnOrder, "currentTokenId">,
  token: IArenaControlledToken & { id: string },
  controllableCharacterIds: readonly string[],
): boolean {
  if (order.currentTokenId !== token.id) return false;
  return canControlToken(viewer, token, controllableCharacterIds);
}

/**
 * Initiative of a token rolled from its menu without a sheet (NPC): 1d20 plus the token bonus.
 */
export function tokenInitiativeExpression(bonus: number): string {
  return joinExpression([D20, bonus]);
}
