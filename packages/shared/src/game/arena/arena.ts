import {
  ARENA_BOARD_DEFAULT_SIDE,
  ARENA_BOARD_MAX_SIDE,
  ARENA_BOARD_MIN_SIDE,
} from "../../schemas/arena";
import type {
  IArenaBoardRequest,
  IArenaBoardSource,
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
 * Keeps a point inside the board (coordinates are world pixels of the board).
 */
export function clampToMap(point: IArenaPoint, bounds: IArenaBounds): IArenaPoint {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));
  return { x: clamp(point.x, bounds.width), y: clamp(point.y, bounds.height) };
}

const roundPx = (value: number) => Math.round(value * 100) / 100;

const clampSide = (value: number) =>
  Math.min(Math.max(value, ARENA_BOARD_MIN_SIDE), ARENA_BOARD_MAX_SIDE);

/**
 * The board for a requested size. With a map the height always follows the map's aspect ratio (only the width
 * counts) and both sides shrink or grow together to fit the limits, the largest side winning when the map is
 * too thin for both; without a map each side is free and clamped on its own.
 */
export function fitBoard(request: IArenaBoardRequest, map: IArenaBounds | null): IArenaBounds {
  if (!map || map.width <= 0 || map.height <= 0) {
    return {
      width: roundPx(clampSide(request.width)),
      height: roundPx(clampSide(request.height ?? request.width)),
    };
  }
  const ratio = map.height / map.width;
  let width = request.width;
  let height = width * ratio;
  const grow = ARENA_BOARD_MIN_SIDE / Math.min(width, height);
  if (grow > 1) {
    width *= grow;
    height *= grow;
  }
  const shrink = ARENA_BOARD_MAX_SIDE / Math.max(width, height);
  if (shrink < 1) {
    width *= shrink;
    height *= shrink;
  }
  return { width: roundPx(width), height: roundPx(height) };
}

/**
 * The board of a scene: the size the GM chose, else the natural size of the map (within the limits), else the
 * default empty board.
 */
export function resolveBoard(source: IArenaBoardSource): IArenaBounds {
  if (source.boardWidth !== null && source.boardHeight !== null)
    return { width: source.boardWidth, height: source.boardHeight };
  if (source.mapWidth !== null && source.mapHeight !== null)
    return fitBoard(
      { width: source.mapWidth },
      { width: source.mapWidth, height: source.mapHeight },
    );
  return { width: ARENA_BOARD_DEFAULT_SIDE, height: ARENA_BOARD_DEFAULT_SIDE };
}

/**
 * Moves a token point from one board size to another so it stays on the same spot of the map.
 */
export function scaleBoardPoint(
  point: IArenaPoint,
  from: IArenaBounds,
  to: IArenaBounds,
): IArenaPoint {
  const scaleX = from.width > 0 ? to.width / from.width : 1;
  const scaleY = from.height > 0 ? to.height / from.height : 1;
  return clampToMap({ x: roundPx(point.x * scaleX), y: roundPx(point.y * scaleY) }, to);
}
