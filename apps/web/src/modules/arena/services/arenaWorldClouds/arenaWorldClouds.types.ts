import type { IArenaBounds, IWorldFogStroke } from "@magista/shared";

export interface IArenaWorldCloudsOptions {
  lite: boolean;
  board: IArenaBounds;
  seed: number;
}

/** The world rectangle on screen right now (the cover mesh is fitted to it). */
export interface IWorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type { IWorldFogStroke };
