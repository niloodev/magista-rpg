import type { AccountRole } from "../../schemas/account";

export interface IArenaPoint {
  x: number;
  y: number;
}

export interface IArenaBounds {
  width: number;
  height: number;
}

export interface IArenaControlViewer {
  role: AccountRole;
}

export interface IArenaControlledToken {
  characterId: string | null;
}

/** What decides a scene's board: the size the GM chose (if any) and the natural size of its map (if any). */
export interface IArenaBoardSource {
  boardWidth: number | null;
  boardHeight: number | null;
  mapWidth: number | null;
  mapHeight: number | null;
}

/** A requested board size; with a map only the width counts. */
export interface IArenaBoardRequest {
  width: number;
  height?: number;
}
