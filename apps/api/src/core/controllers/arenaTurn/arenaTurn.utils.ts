import {
  advanceTurn,
  moveTurnEntry,
  placeTurnEntries,
  removeTurnEntries,
  sortTurnEntries,
  type IArenaTurnCommand,
  type IArenaTurnEntry,
  type IArenaTurnOrder,
} from "@magista/shared";

/**
 * The new order after a command (the rolled values already computed for `roll`), or null when nothing changes.
 */
export function applyTurnCommand(
  order: IArenaTurnOrder,
  command: IArenaTurnCommand,
  rolled: IArenaTurnEntry[] = [],
): IArenaTurnOrder | null {
  const has = (tokenId: string) => order.entries.some((entry) => entry.tokenId === tokenId);
  switch (command.action) {
    case "next":
    case "previous":
      if (order.entries.length === 0) return null;
      return { ...order, ...advanceTurn(order, command.action === "next" ? 1 : -1) };
    case "endTurn":
      if (order.currentTokenId !== command.tokenId) return null;
      return { ...order, ...advanceTurn(order, 1) };
    case "add": {
      const added = command.tokenIds.filter((id) => !has(id));
      if (added.length === 0) return null;
      const entries = added.map((tokenId) => ({ tokenId, initiative: null }));
      return { ...order, entries: placeTurnEntries(order.entries, entries) };
    }
    case "remove":
      if (!command.tokenIds.some(has)) return null;
      return { ...order, ...removeTurnEntries(order, command.tokenIds) };
    case "roll":
      return rolled.length === 0
        ? null
        : { ...order, entries: placeTurnEntries(order.entries, rolled) };
    case "set":
      if (!has(command.tokenId)) return null;
      return {
        ...order,
        entries: placeTurnEntries(order.entries, [
          { tokenId: command.tokenId, initiative: command.initiative },
        ]),
      };
    case "move":
      if (!has(command.tokenId)) return null;
      return { ...order, entries: moveTurnEntry(order.entries, command.tokenId, command.index) };
    case "focus":
      if (!has(command.tokenId)) return null;
      return { ...order, currentTokenId: command.tokenId };
    case "sort":
      return { ...order, entries: sortTurnEntries(order.entries) };
    case "clear":
      return { ...order, entries: [], round: 1, currentTokenId: null };
  }
}
