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
  ARENA_DOCK_TAB_PREFIX,
  ARENA_DOCK_TEXTS,
  ARENA_HINT_DEFAULT_NAME,
  ARENA_HINT_MAX_TRAY,
  ARENA_MAP_MIN_WIDTH,
  ARENA_ROLLS_WIDTH,
  ARENA_SIDEBAR_STORAGE_KEY,
  ARENA_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR,
} from "@/modules/arena/arena.constants";
import type {
  ArenaDockSide,
  ArenaSidebarTab,
  IArenaDockedSheet,
  IArenaDockedTabs,
  IArenaHint,
  IArenaSelectionSummary,
  IArenaSidebarState,
} from "@/modules/arena/arena.types";

import type { IArenaRenderToken } from "@/modules/arena/services/arenaRenderer";
import type { TabItem } from "@/shared/components/molecules";

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
 * Drag previews queued for the next frame that are still live (their stale timer did not fire), so a preview
 * that arrives late, after the token was saved or the preview expired, is not put back.
 */
export function livePreviews<M extends { tokenId: string }>(
  queued: Map<string, M>,
  timers: Map<string, number>,
): M[] {
  return [...queued.values()].filter((move) => timers.has(move.tokenId));
}

/**
 * Tokens with the live drag previews of other tabs applied (the same list when there is no preview).
 */
export function withPreviews(
  tokens: IArenaRenderToken[],
  previews: Record<string, IArenaPoint>,
): IArenaRenderToken[] {
  if (Object.keys(previews).length === 0) return tokens;
  return tokens.map((token) => {
    const preview = previews[token.id];
    return preview ? { ...token, x: preview.x, y: preview.y } : token;
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

/**
 * Tab key of a docked sheet in a side panel ("sheet:<id>").
 */
export function dockTabKey(characterId: string): string {
  return `${ARENA_DOCK_TAB_PREFIX}${characterId}`;
}

/**
 * Character id of a docked sheet tab key, or null for the panel's own tabs.
 */
export function dockedIdOf(key: string): string | null {
  return key.startsWith(ARENA_DOCK_TAB_PREFIX) ? key.slice(ARENA_DOCK_TAB_PREFIX.length) : null;
}

/**
 * Side panel under a pointer while a sheet window is dragged: the roll feed on the left or the sidebar on the
 * right (only open panels, given by their widths; 0 is closed).
 */
export function dockZoneAt(
  x: number,
  viewportWidth: number,
  panels: { left: number; right: number },
): ArenaDockSide | null {
  if (panels.left > 0 && x <= panels.left) return "left";
  if (panels.right > 0 && x >= viewportWidth - panels.right) return "right";
  return null;
}

/**
 * Tabs of a side panel: its own tabs followed by one per docked sheet.
 */
export function withDockedTabs(
  own: TabItem<string>[],
  sheets: IArenaDockedSheet[],
): TabItem<string>[] {
  return [
    ...own,
    ...sheets.map((sheet) => ({
      key: dockTabKey(sheet.id),
      label: ARENA_DOCK_TEXTS.tab(sheet.name),
      icon: "scroll-text" as const,
    })),
  ];
}

/**
 * Display name of an open sheet: the loaded sheet, else the library entry, else null.
 */
export function sheetNameOf(
  characterId: string,
  names: Record<string, string | null>,
  characters: { id: string; name: string }[],
): string | null {
  return (
    names[characterId] ?? characters.find((character) => character.id === characterId)?.name ?? null
  );
}

/**
 * Docked sheet tabs of one side panel, with their names (the renderer of each tab is added by the page).
 */
export function dockedTabsOf(
  side: ArenaDockSide,
  docked: Record<ArenaDockSide, string[]>,
  dockTab: Record<ArenaDockSide, string | null>,
  names: Record<string, string | null>,
  characters: { id: string; name: string }[],
  showTab: (side: ArenaDockSide, characterId: string | null) => void,
): Omit<IArenaDockedTabs, "render"> {
  return {
    sheets: docked[side].map((id) => ({ id, name: sheetNameOf(id, names, characters) })),
    active: dockTab[side],
    onShow: (characterId) => showTab(side, characterId),
  };
}

/**
 * Side where a sheet is docked, or null when it is not docked.
 */
export function dockSideOf(
  docked: Record<ArenaDockSide, string[]>,
  characterId: string,
): ArenaDockSide | null {
  if (docked.left.includes(characterId)) return "left";
  return docked.right.includes(characterId) ? "right" : null;
}

/**
 * Widths the open side panels actually take: the chosen ones, shrunk together (not below their minimums) when
 * they would leave less than `ARENA_MAP_MIN_WIDTH` of map on a narrow screen. 0 for a closed panel.
 */
export function fitPanels(
  rolls: number,
  sidebar: number,
  viewportWidth: number,
): { left: number; right: number } {
  const available = viewportWidth - ARENA_MAP_MIN_WIDTH;
  const total = rolls + sidebar;
  if (total <= available || total === 0) return { left: rolls, right: sidebar };
  const scale = Math.max(available, 0) / total;
  const shrink = (width: number, min: number) =>
    width === 0 ? 0 : Math.max(Math.round(width * scale), min);
  return {
    left: shrink(rolls, ARENA_ROLLS_WIDTH.min),
    right: shrink(sidebar, ARENA_SIDEBAR_WIDTH.min),
  };
}
