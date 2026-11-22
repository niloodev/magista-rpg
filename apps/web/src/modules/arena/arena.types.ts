import type {
  ArenaChangeKind,
  ArenaEffectStyle,
  ArenaResourceKey,
  IArenaEffect,
  IArenaPoint,
  TokenStyle,
} from "@magista/shared";
import type { ReactNode } from "react";

export type ArenaSelectionMode = "replace" | "add" | "toggle";

/** New size of one token (resize handles and the size control). */
export interface IArenaSizeUpdate {
  id: string;
  size: number;
}

export interface IArenaSelectionSummary {
  size: number | null;
  allHidden: boolean;
  sheetTarget: string | null;
}

export type ArenaStageStatus = "loading" | "ready" | "unsupported";

export interface IArenaStageControls {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  centerOn: (tokenId: string) => void;
  /** Map point under a page point, or null outside the visible map area. */
  clientToWorld: (clientX: number, clientY: number) => IArenaPoint | null;
  /** Current camera zoom (1 before the map loads). */
  zoom: () => number;
  /** Map point at the center of the visible area (null before the map loads). */
  visibleCenter: () => IArenaPoint | null;
  /** Map point under the mouse while it is over the visible map area, or null. */
  pointerWorld: () => IArenaPoint | null;
  retryMap: () => void;
  playEffects: (effects: IArenaEffect[]) => void;
  /**
   * Warms every animation of the board out of sight (waits for the board to exist; resolves at once without one).
   */
  warmEffects: (onProgress: (ratio: number) => void) => Promise<void>;
}

/** One action of "Aplicar mudança". */
export interface IArenaChangeAction {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
}

/**
 * What an effect fits best (filters of the picker). `free`: an effect with no action of its own (never the automatic one), usable for anything; `ultimate`: a
 * character's signature spell, the biggest animations (they take over the whole screen).
 */
export type ArenaEffectTag = "damage" | "heal" | "health" | "sanity" | "free" | "ultimate";

export type ArenaEffectFilter = ArenaEffectTag | "all" | "fits";

/** One effect of the catalog, as the menu and the picker show it. */
export interface IArenaEffectCatalogEntry {
  name: string;
  description: string;
  tags: ArenaEffectTag[];
  /** Tailwind background class of its mark in the list. */
  accent: string;
  /** What the attacker does: flies and strikes, casts an orb or shoots. */
  attack: "lunge" | "cast" | "shot";
}

/** Animation picked for a change: one by name, or "auto" (the one of the action and attribute). */
export type ArenaEffectChoice = ArenaEffectStyle | "auto";

/** What "Aplicar mudança" is set to (action, attribute, animation), plus the last amount; kept on this device. */
export interface IArenaChangePreference extends IArenaChangeAction {
  amount: number;
  effect: ArenaEffectChoice;
}

/** The open "Aplicar mudança" menu: which tokens, how it is called and where it opens (null: by the selection bar). */
export interface IArenaChangeMenuState {
  tokenIds: string[];
  target: string;
  /** Portraits of the first targets (up to three), for the header. */
  targetImages: IArenaTokenImage[];
  anchor: IArenaPoint | null;
}

/** A token that may deal a change, as the menu shows it. */
/** What saving the token settings does to the NPC image. */
export type ArenaTokenImageChange = { action: "upload"; file: File } | { action: "remove" } | null;

/** A token portrait outside the map: its image and whether it is an isometric figure. */
export interface IArenaTokenImage {
  url: string | null;
  style: TokenStyle;
}

export interface IArenaAttackerOption {
  id: string;
  name: string;
  imageUrl: string | null;
  style: TokenStyle;
}

export interface IArenaHint {
  known: boolean;
  tray: number;
  nameLength: number;
  /** Width of each side panel on the last visit (0 when it was closed). */
  sidebarWidth: number;
  rollsWidth: number;
  /** Sidebar tab open on the last visit. */
  tab: ArenaSidebarTab;
}

export type ArenaSidebarTab = "characters" | "scenes";

/** Side panel a sheet can be docked into: the roll feed (left) or the sidebar (right). */
export type ArenaDockSide = "left" | "right";

export interface IArenaSidebarState {
  open: boolean;
  tab: ArenaSidebarTab;
  rollsOpen: boolean;
  width: number;
  rollsWidth: number;
}

export interface IPendingNudge {
  tokenId: string;
  point: IArenaPoint;
}

/** A sheet docked as a tab in a side panel. */
export interface IArenaDockedSheet {
  id: string;
  name: string | null;
}

/** Docked sheet tabs of one side panel. */
export interface IArenaDockedTabs {
  sheets: IArenaDockedSheet[];
  /** Docked sheet shown, or null for the panel's own tab. */
  active: string | null;
  onShow: (characterId: string | null) => void;
  render: (characterId: string) => ReactNode;
}

/** One line of the turn order window. */
export interface IArenaTurnRow {
  id: string;
  name: string;
  imageUrl: string | null;
  style: TokenStyle;
  /** Ruby for the viewer's own tokens, teal for the others (as on the map). */
  tone: "own" | "other";
  hidden: boolean;
  initiative: number | null;
  current: boolean;
  /** Its turn comes right after the current one. */
  upNext: boolean;
  /** Its initiative is being rolled (the value spins until the dice reveal). */
  rolling: boolean;
}

/** Turn order actions of the token menu for the selection. */
export interface IArenaTurnMenuActions {
  canRoll: boolean;
  /** Some selected token is out of the order (GM). */
  canAdd: boolean;
  /** Some selected token is in the order (GM). */
  canRemove: boolean;
  onRoll: () => void;
  onAdd: () => void;
  onRemove: () => void;
}

/** What the GM's left button does on the world map: move the party, or paint the fog. */
export type WorldFogTool = "move" | "hide" | "reveal";

/** The fog tools of the world map as the GM's panel shows them. */
export interface IWorldFogTools {
  tool: WorldFogTool;
  radius: number;
  playerView: boolean;
  pending: boolean;
  onTool: (tool: WorldFogTool) => void;
  onRadius: (radius: number | null) => void;
  onPlayerView: (playerView: boolean) => void;
  onFill: (mode: "hide" | "reveal") => void;
}
