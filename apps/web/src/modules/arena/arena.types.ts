import type { IArenaPoint } from "@magista/shared";
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
