import {
  ARENA_NAME_MAX_LENGTH,
  canControlToken,
  type IArenaPoint,
  type IArenaView,
} from "@magista/shared";

import { ARENA_HINT_DEFAULT_NAME, ARENA_HINT_MAX_TRAY } from "@/modules/arena/arena.constants";
import type { IArenaHint } from "@/modules/arena/arena.types";

import type { IArenaRenderToken } from "@/modules/arena/services/arenaRenderer";

/**
 * Turns the loaded view into what the board draws: live drag previews win over stored positions, and the ring
 * tone tells the viewer what is theirs (a player's own tokens, the GM's NPCs) apart from the rest.
 */
export function toRenderTokens(
  view: IArenaView,
  previews: Record<string, IArenaPoint>,
  isGm: boolean,
  mediaUrl: (path: string | null) => string | null,
): IArenaRenderToken[] {
  const viewer = { role: isGm ? ("GM" as const) : ("PLAYER" as const) };
  return view.tokens.map((token) => {
    const controllable = canControlToken(viewer, token, view.controllableCharacterIds);
    const own = isGm ? token.characterId === null : controllable;
    const preview = previews[token.id];
    return {
      id: token.id,
      name: token.name,
      imageUrl: mediaUrl(token.imageUrl),
      x: preview?.x ?? token.x,
      y: preview?.y ?? token.y,
      size: token.size,
      hidden: token.hidden,
      controllable,
      tone: own ? "own" : "other",
    };
  });
}

/**
 * Arena part of the skeleton hints cookie: how many tokens the tray had and the length of the scene name (0 when
 * no scene was live). Never names or ids.
 */
export function arenaHint(tray: number, sceneName: string | null): [number, number] {
  return [
    Math.min(tray, ARENA_HINT_MAX_TRAY),
    Math.min(sceneName?.length ?? 0, ARENA_NAME_MAX_LENGTH),
  ];
}

/**
 * Reads the stored Arena hint, ignoring anything malformed.
 */
export function parseArenaHint(value: unknown): IArenaHint {
  const unknown = { known: false, tray: 0, nameLength: ARENA_HINT_DEFAULT_NAME };
  if (!Array.isArray(value) || value.length !== 2) return unknown;
  const [tray, name] = value as unknown[];
  if (typeof tray !== "number" || typeof name !== "number") return unknown;
  if (!Number.isFinite(tray) || !Number.isFinite(name)) return unknown;
  const clamp = (input: number, max: number) => Math.min(Math.max(Math.trunc(input), 0), max);
  return {
    known: true,
    tray: clamp(tray, ARENA_HINT_MAX_TRAY),
    nameLength: clamp(name, ARENA_NAME_MAX_LENGTH),
  };
}

/**
 * Rounds a map position to one decimal, enough precision for a token.
 */
export function roundPoint(point: IArenaPoint): IArenaPoint {
  return { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 };
}

/**
 * Direction of an arrow key, or null for any other key.
 */
export function arrowDelta(key: string): IArenaPoint | null {
  if (key === "ArrowUp") return { x: 0, y: -1 };
  if (key === "ArrowDown") return { x: 0, y: 1 };
  if (key === "ArrowLeft") return { x: -1, y: 0 };
  if (key === "ArrowRight") return { x: 1, y: 0 };
  return null;
}
