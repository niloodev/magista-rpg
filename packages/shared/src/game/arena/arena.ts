import {
  ARENA_BOARD_DEFAULT_SIDE,
  ARENA_BOARD_MAX_SIDE,
  ARENA_BOARD_MIN_SIDE,
} from "../../schemas/arena";
import type {
  ArenaChangeKind,
  ArenaEffectStyle,
  ArenaResourceKey,
  ISheetEffects,
} from "../../schemas/arena";
import { SHEET_LIMITS, type ISheetResource } from "../../schemas/character";
import type {
  IArenaBoardRequest,
  IArenaBoardSource,
  IArenaBounds,
  IArenaControlledToken,
  IArenaControlViewer,
  IArenaPoint,
  IArenaStatusViewer,
  IArenaStatusRules,
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
 * Who sees a token status: the GM, the accounts with access to the token sheet, and the accounts the token lists
 * (or every player when the token is public).
 */
export function canSeeTokenStatus(
  viewer: IArenaStatusViewer,
  token: IArenaControlledToken,
  rules: IArenaStatusRules,
): boolean {
  if (viewer.role === "GM") return true;
  if (token.characterId !== null && rules.accessibleCharacterIds.includes(token.characterId)) {
    return true;
  }
  return rules.access.public || rules.access.accountIds.includes(viewer.accountId);
}

/**
 * Whether a resource can take damage or healing: it needs a current value or a maximum.
 */
export function hasResource(resource: ISheetResource): boolean {
  return resource.current !== null || resource.max !== null;
}

/**
 * Applies damage or healing to a resource: damage stops at 0, healing at the maximum (no ceiling without one).
 * An empty current value starts from the maximum (or 0). Never past the sheet limit (`SHEET_LIMITS.resource`),
 * so a sheet always stays valid.
 */
export function applyResourceChange(
  resource: ISheetResource,
  kind: ArenaChangeKind,
  amount: number,
): ISheetResource {
  const start = resource.current ?? resource.max ?? 0;
  if (kind === "damage") {
    return { ...resource, current: Math.min(start, Math.max(start - amount, 0)) };
  }
  const healed = start + amount;
  const ceiling = resource.max === null ? healed : Math.max(resource.max, start);
  return {
    ...resource,
    current: Math.max(
      Math.min(healed, ceiling, SHEET_LIMITS.resource),
      Math.min(start, SHEET_LIMITS.resource),
    ),
  };
}

/**
 * The automatic animation of a change: Golpe (damage to health), Fissura (damage to sanity), Brasa viva (healing
 * health) and Clareza (healing sanity).
 */
export function autoEffectStyle(
  kind: ArenaChangeKind,
  resource: ArenaResourceKey,
): ArenaEffectStyle {
  if (kind === "damage") return resource === "health" ? "strike" : "fissure";
  return resource === "health" ? "ember" : "clarity";
}

/**
 * The animation "Automático" plays: the one the attacking sheet prefers for this action and attribute, else the
 * default of the action.
 */
export function resolveAutoEffect(
  kind: ArenaChangeKind,
  resource: ArenaResourceKey,
  effects?: ISheetEffects | null,
): ArenaEffectStyle {
  return effects?.[kind]?.[resource] ?? autoEffectStyle(kind, resource);
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
