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
