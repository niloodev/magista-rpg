import type { IArenaPoint } from "@magista/shared";

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
