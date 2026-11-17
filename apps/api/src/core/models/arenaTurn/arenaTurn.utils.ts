import type { IArenaTurnOrder } from "@magista/shared";

export interface ArenaTurnSceneRow {
  id: string;
  turnRound: number;
  turnTokenId: string | null;
}

export interface ArenaTurnEntryRow {
  tokenId: string;
  initiative: number | null;
}

/**
 * Maps the stored scene pointer and its entries (already in order) to the turn order DTO; a current token that is
 * no longer in the order counts as nobody.
 */
export function toArenaTurnOrder(
  scene: ArenaTurnSceneRow,
  entries: ArenaTurnEntryRow[],
): IArenaTurnOrder {
  const current = scene.turnTokenId;
  return {
    sceneId: scene.id,
    round: scene.turnRound,
    currentTokenId:
      current !== null && entries.some((entry) => entry.tokenId === current) ? current : null,
    entries: entries.map(({ tokenId, initiative }) => ({ tokenId, initiative })),
  };
}
