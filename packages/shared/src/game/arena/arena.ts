import type {
  IArenaBounds,
  IArenaControlledToken,
  IArenaControlViewer,
  IArenaPoint,
} from "./arena.types";

/**
 * The GM controls every token; a player only the tokens of characters granted to their account (NPCs never).
 */
export function canControlToken(
  viewer: IArenaControlViewer,
  token: IArenaControlledToken,
  controllableCharacterIds: readonly string[],
): boolean {
  if (viewer.role === "GM") return true;
  return token.characterId !== null && controllableCharacterIds.includes(token.characterId);
}

/**
 * Keeps a point inside the map (coordinates are pixels of the original map image).
 */
export function clampToMap(point: IArenaPoint, bounds: IArenaBounds): IArenaPoint {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));
  return { x: clamp(point.x, bounds.width), y: clamp(point.y, bounds.height) };
}
