import type { IArenaPoint } from "@magista/shared";

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
