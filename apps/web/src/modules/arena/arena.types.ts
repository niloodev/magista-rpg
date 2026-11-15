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
  retryMap: () => void;
}

export interface IArenaHint {
  known: boolean;
  tray: number;
  nameLength: number;
}

export interface IPendingNudge {
  tokenId: string;
  point: IArenaPoint;
}
