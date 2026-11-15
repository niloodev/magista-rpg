import {
  ARENA_NAME_MAX_LENGTH,
  canControlToken,
  clampToMap,
  type IArenaBounds,
  type IArenaPoint,
  type IArenaToken,
  type IArenaView,
} from "@magista/shared";

import {
  ARENA_HINT_DEFAULT_NAME,
  ARENA_HINT_MAX_TRAY,
  ARENA_ROLLS_WIDTH,
  ARENA_SIDEBAR_STORAGE_KEY,
  ARENA_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR,
} from "@/modules/arena/arena.constants";
import type {
  ArenaSidebarTab,
  IArenaHint,
  IArenaSelectionSummary,
  IArenaSidebarState,
} from "@/modules/arena/arena.types";

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
 * Arena part of the skeleton hints cookie: how many tokens the tray had, the length of the scene name (0 when
 * no scene was live) and the width of each side panel (0 when closed). Never names or ids.
 */
export function arenaHint(
  tray: number,
  sceneName: string | null,
  panels: IArenaSidebarState,
): [number, number, number, number, number] {
  return [
    Math.min(tray, ARENA_HINT_MAX_TRAY),
    Math.min(sceneName?.length ?? 0, ARENA_NAME_MAX_LENGTH),
    panels.open ? panels.width : 0,
    panels.rollsOpen ? panels.rollsWidth : 0,
    panels.tab === "scenes" ? 1 : 0,
  ];
}

/**
 * A panel width read from storage or a hint: 0 means closed, anything else is kept inside the limits.
 */
export function panelWidth(
  value: unknown,
  limits: { default: number; min: number; max: number },
  allowClosed: boolean,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return limits.default;
  if (allowClosed && value === 0) return 0;
  if (value < limits.min) return limits.default;
  return Math.round(Math.min(value, limits.max));
}

/**
 * Reads the stored Arena hint, ignoring anything malformed.
 */
export function parseArenaHint(value: unknown): IArenaHint {
  const unknown = {
    known: false,
    tray: 0,
    nameLength: ARENA_HINT_DEFAULT_NAME,
    sidebarWidth: ARENA_SIDEBAR_WIDTH.default,
    rollsWidth: ARENA_ROLLS_WIDTH.default,
    tab: "characters" as ArenaSidebarTab,
  };
  if (!Array.isArray(value) || value.length < 2 || value.length > 5) return unknown;
  const [tray, name, sidebar, rolls, tab] = value as unknown[];
  if (typeof tray !== "number" || typeof name !== "number") return unknown;
  if (!Number.isFinite(tray) || !Number.isFinite(name)) return unknown;
  const clamp = (input: number, max: number) => Math.min(Math.max(Math.trunc(input), 0), max);
  return {
    known: true,
    tray: clamp(tray, ARENA_HINT_MAX_TRAY),
    nameLength: clamp(name, ARENA_NAME_MAX_LENGTH),
    sidebarWidth: panelWidth(sidebar, ARENA_SIDEBAR_WIDTH, true),
    rollsWidth: panelWidth(rolls, ARENA_ROLLS_WIDTH, true),
    tab: tab === 1 ? "scenes" : "characters",
  };
}

/**
 * Reads the panels state saved on this device (right sidebar open and tab, roll feed open), falling back
 * to both open on "Fichas".
 */
export function parseSidebarState(raw: string | null): IArenaSidebarState {
  if (!raw) return DEFAULT_SIDEBAR;
  try {
    const value = JSON.parse(raw) as Partial<IArenaSidebarState>;
    const tabs: IArenaSidebarState["tab"][] = ["characters", "scenes"];
    return {
      open: typeof value.open === "boolean" ? value.open : DEFAULT_SIDEBAR.open,
      tab: value.tab && tabs.includes(value.tab) ? value.tab : DEFAULT_SIDEBAR.tab,
      rollsOpen: typeof value.rollsOpen === "boolean" ? value.rollsOpen : DEFAULT_SIDEBAR.rollsOpen,
      width: panelWidth(value.width, ARENA_SIDEBAR_WIDTH, false),
      rollsWidth: panelWidth(value.rollsWidth, ARENA_ROLLS_WIDTH, false),
    };
  } catch {
    return DEFAULT_SIDEBAR;
  }
}

/**
 * What the selection bar shows: the common size (or the largest when they differ, so +/- start from a real
 * size), whether every token is hidden and which sheet "Abrir ficha" opens (one character token the viewer
 * may open).
 */
export function selectionSummary(
  tokens: IArenaToken[],
  isGm: boolean,
  controllableCharacterIds: string[],
): IArenaSelectionSummary {
  const [first] = tokens;
  const characterId = tokens.length === 1 ? (first?.characterId ?? null) : null;
  return {
    size: tokens.length > 0 ? Math.max(...tokens.map((token) => token.size)) : null,
    allHidden: tokens.length > 0 && tokens.every((token) => token.hidden),
    sheetTarget:
      characterId && (isGm || controllableCharacterIds.includes(characterId)) ? characterId : null,
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

/**
 * Sidebar state saved on this device (the default during server rendering or when storage is blocked).
 */
export function readSidebarState(): IArenaSidebarState {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR;
  try {
    return parseSidebarState(window.localStorage.getItem(ARENA_SIDEBAR_STORAGE_KEY));
  } catch {
    return DEFAULT_SIDEBAR;
  }
}

/**
 * Saves the panels state on this device (ignored when storage is blocked).
 */
export function saveSidebarState(state: IArenaSidebarState): void {
  try {
    window.localStorage.setItem(ARENA_SIDEBAR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

/**
 * Where a new token lands: the point kept inside the map (when the map size is known) and rounded.
 */
export function placementPoint(point: IArenaPoint, bounds: IArenaBounds): IArenaPoint {
  const inside = bounds.width > 0 && bounds.height > 0 ? clampToMap(point, bounds) : point;
  return roundPoint(inside);
}
