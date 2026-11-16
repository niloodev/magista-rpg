import type {
  ArenaChangeKind,
  ArenaEffectStyle,
  ArenaResourceKey,
  IArenaEffect,
  IArenaPoint,
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
  retryMap: () => void;
  playEffects: (effects: IArenaEffect[]) => void;
}

/** One action of "Aplicar mudança". */
export interface IArenaChangeAction {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
}

/** What an effect fits best (filters of the picker). */
export type ArenaEffectTag = "damage" | "heal" | "health" | "sanity";

export type ArenaEffectFilter = ArenaEffectTag | "all" | "fits";

/** One effect of the catalog, as the menu and the picker show it. */
export interface IArenaEffectCatalogEntry {
  name: string;
  description: string;
  tags: ArenaEffectTag[];
  /** Tailwind background class of its mark in the list. */
  accent: string;
  /** What the attacker does: flies and strikes, or casts an orb. */
  attack: "lunge" | "cast";
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
  targetImages: (string | null)[];
  anchor: IArenaPoint | null;
}

/** A token that may deal a change, as the menu shows it. */
export interface IArenaAttackerOption {
  id: string;
  name: string;
  imageUrl: string | null;
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
