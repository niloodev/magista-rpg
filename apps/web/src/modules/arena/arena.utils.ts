import {
  matchesSearch,
  type ArenaChangeKind,
  type ArenaEffectStyle,
  type ArenaResourceKey,
  ARENA_EFFECT_STYLES,
  ARENA_CHANGE_AMOUNT_MAX,
  ARENA_CHANGE_KINDS,
  ARENA_RESOURCE_KEYS,
  ARENA_NAME_MAX_LENGTH,
  canControlToken,
  clampToMap,
  type IArenaBounds,
  type IArenaPoint,
  type IArenaToken,
  type IArenaTokenStatus,
  type IArenaView,
  type ICopyArenaTokensInput,
  ARENA_UNIT_PX,
  ARENA_TOKEN_SIZE_DEFAULT,
} from "@magista/shared";

import {
  ARENA_CHANGE_STORAGE_KEY,
  ARENA_HIDDEN_NAME,
  ARENA_TRANSPARENT_ALPHA,
  ARENA_TRANSPARENT_EDGE_SHARE,
  ARENA_STATUS_TEXTS,
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
  ArenaEffectFilter,
  IArenaEffectCatalogEntry,
  IArenaChangePreference,
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
 * Turns the loaded view into what the board draws; the ring tone tells the viewer what is theirs (a player's
 * own tokens, the GM's NPCs) apart from the rest.
 */
export function toRenderTokens(
  view: IArenaView,
  isGm: boolean,
  mediaUrl: (path: string | null) => string | null,
): IArenaRenderToken[] {
  const viewer = { role: isGm ? ("GM" as const) : ("PLAYER" as const) };
  return view.tokens.map((token) => {
    const controllable = canControlToken(viewer, token, view.controllableCharacterIds);
    const own = isGm ? token.characterId === null : controllable;
    return {
      id: token.id,
      name: token.name,
      imageUrl: mediaUrl(
        token.style === "figure" ? token.imageUrl : (token.imageThumbUrl ?? token.imageUrl),
      ),
      style: token.style,
      x: token.x,
      y: token.y,
      size: token.size,
      hidden: token.hidden,
      label: token.showName ? "shown" : isGm ? "faint" : "hidden",
      controllable,
      tone: own ? "own" : "other",
      status: view.statuses[token.id] ?? null,
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

const DEFAULT_CHANGE: IArenaChangePreference = {
  kind: "damage",
  resource: "health",
  amount: 5,
  effect: "auto",
};

/**
 * The last action and amount of "Aplicar mudança" saved on this device (damage to health, 5, without one).
 */
export function readChangePreference(): IArenaChangePreference {
  try {
    const raw = window.localStorage.getItem(ARENA_CHANGE_STORAGE_KEY);
    if (!raw) return DEFAULT_CHANGE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_CHANGE;
    const { kind, resource, amount, effect } = parsed as Record<string, unknown>;
    const validKind = ARENA_CHANGE_KINDS.find((entry) => entry === kind);
    const validResource = ARENA_RESOURCE_KEYS.find((entry) => entry === resource);
    const validAmount =
      typeof amount === "number" &&
      Number.isInteger(amount) &&
      amount >= 1 &&
      amount <= ARENA_CHANGE_AMOUNT_MAX;
    if (!validKind || !validResource || !validAmount) return DEFAULT_CHANGE;
    const validEffect = ARENA_EFFECT_STYLES.find((entry) => entry === effect) ?? "auto";
    return { kind: validKind, resource: validResource, amount, effect: validEffect };
  } catch {
    return DEFAULT_CHANGE;
  }
}

/**
 * Remembers the last action and amount of "Aplicar mudança" on this device.
 */
export function saveChangePreference(preference: IArenaChangePreference): void {
  try {
    window.localStorage.setItem(ARENA_CHANGE_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    return;
  }
}

/**
 * Tokens hit by "Aplicar mudança" from a token: the whole selection when it belongs to it, else only it.
 */
export function changeTargets(selected: readonly string[], tokenId: string): string[] {
  return selected.includes(tokenId) ? [...selected] : [tokenId];
}

/**
 * Text readout of a token status ("Vida 12/20 · Sanidade 8/15"), or null without any value to show.
 */
export function statusReadout(status: IArenaTokenStatus | null | undefined): string | null {
  if (!status) return null;
  const value = ({ current, max }: IArenaTokenStatus["health"]) =>
    max === null && current === null ? null : `${current ?? max ?? 0}/${max ?? "?"}`;
  const health = value(status.health);
  const sanity = value(status.sanity);
  const parts = [
    ...(health ? [ARENA_STATUS_TEXTS.health(health)] : []),
    ...(sanity ? [ARENA_STATUS_TEXTS.sanity(sanity)] : []),
  ];
  return parts.length > 0 ? ARENA_STATUS_TEXTS.readout(parts) : null;
}

/**
 * Keeps a floating menu inside the viewport, opening it next to the point (to the left or above when it does
 * not fit).
 */
export function placeMenu(
  anchor: IArenaPoint,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 12,
): IArenaPoint {
  const x = anchor.x + size.width + margin > viewport.width ? anchor.x - size.width : anchor.x;
  const y = anchor.y + size.height + margin > viewport.height ? anchor.y - size.height : anchor.y;
  return {
    x: Math.min(Math.max(x, margin), Math.max(viewport.width - size.width - margin, margin)),
    y: Math.min(Math.max(y, margin), Math.max(viewport.height - size.height - margin, margin)),
  };
}

/**
 * Effects of the catalog that match the search (name or description, ignoring accents and case) and the filter:
 * a tag, "fits" (made for the action and attribute set) or "all". Keeps the catalog order.
 */
export function filterEffects(
  catalog: Record<ArenaEffectStyle, IArenaEffectCatalogEntry>,
  query: string,
  filter: ArenaEffectFilter,
  kind: ArenaChangeKind,
  resource: ArenaResourceKey,
): ArenaEffectStyle[] {
  return ARENA_EFFECT_STYLES.filter((style) => {
    const entry = catalog[style];
    const tagged =
      filter === "all" ||
      (filter === "fits"
        ? entry.tags.includes("free") ||
          (entry.tags.includes(kind) && entry.tags.includes(resource))
        : entry.tags.includes(filter));
    return tagged && (matchesSearch(entry.name, query) || matchesSearch(entry.description, query));
  });
}

/**
 * Where pasted copies go: the group keeps its layout, centered on `anchor` (the pointer over the map) or, without
 * it, one board unit down and to the right of the originals; every copy stays inside the board.
 */
export function pastePlacements(
  tokens: Pick<IArenaToken, "id" | "x" | "y">[],
  anchor: IArenaPoint | null,
  bounds: IArenaBounds,
): ICopyArenaTokensInput["tokens"] {
  if (tokens.length === 0) return [];
  const centerX = tokens.reduce((sum, token) => sum + token.x, 0) / tokens.length;
  const centerY = tokens.reduce((sum, token) => sum + token.y, 0) / tokens.length;
  const offset = anchor
    ? { x: anchor.x - centerX, y: anchor.y - centerY }
    : { x: ARENA_UNIT_PX, y: ARENA_UNIT_PX };
  return tokens.map((token) => {
    const point = clampToMap({ x: token.x + offset.x, y: token.y + offset.y }, bounds);
    return { sourceId: token.id, x: Math.round(point.x), y: Math.round(point.y) };
  });
}

/**
 * Token name from an image file name: without the extension, with dashes and underscores as spaces, cut to the
 * name limit.
 */
export function tokenNameFromFile(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (base || "Token").slice(0, ARENA_NAME_MAX_LENGTH);
}

/**
 * Points for tokens dropped together: side by side in a row centered on the drop point, one default token
 * apart, kept on the board.
 */
export function dropPlacements(
  point: IArenaPoint,
  count: number,
  bounds: IArenaBounds,
): IArenaPoint[] {
  const step = ARENA_TOKEN_SIZE_DEFAULT + ARENA_UNIT_PX / 2;
  const first = point.x - ((count - 1) * step) / 2;
  return Array.from({ length: count }, (_, index) =>
    clampToMap({ x: first + index * step, y: point.y }, bounds),
  );
}

/**
 * Whether an image looks like a cut-out (isometric figure): a good part of its border pixels is transparent.
 * `data` is RGBA, as read from a canvas.
 */
export function hasTransparentEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  if (width === 0 || height === 0) return false;
  let edge = 0;
  let clear = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x !== 0 && y !== 0 && x !== width - 1 && y !== height - 1) continue;
      edge += 1;
      if ((data[(y * width + x) * 4 + 3] ?? 255) < ARENA_TRANSPARENT_ALPHA) clear += 1;
    }
  }
  return clear / edge >= ARENA_TRANSPARENT_EDGE_SHARE;
}

/**
 * Name of a token as the viewer reads it outside the map: players get a neutral word when the GM hid the name.
 */
export function tokenDisplayName(
  token: Pick<IArenaToken, "name" | "showName">,
  isGm: boolean,
): string {
  return token.showName || isGm ? token.name : ARENA_HIDDEN_NAME;
}

/**
 * Attacker of "Aplicar mudança": the one chosen while the menu is open ("" is nobody), else, for a player, their
 * first token on the scene (the GM starts with nobody); a choice no longer on the list falls back to nobody.
 */
export function pickAttacker(
  options: { id: string }[],
  chosen: string | null,
  isGm: boolean,
): string {
  if (chosen === null) return isGm ? "" : (options[0]?.id ?? "");
  return options.some((option) => option.id === chosen) ? chosen : "";
}
