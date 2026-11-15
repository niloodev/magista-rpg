import type { IArenaToken } from "@magista/shared";

export interface ICreateArenaTokenRow {
  characterId: string | null;
  name: string | null;
  x: number;
  y: number;
  size: number;
  hidden: boolean;
}

export interface IUpdateArenaTokenRow {
  name?: string;
  size?: number;
  hidden?: boolean;
}

export interface IRemovedArenaToken {
  id: string;
  sceneId: string;
  hidden: boolean;
}

export interface IArenaMoveGuard {
  sceneId: string;
}

export interface IArenaTokenModels {
  listByScene: (sceneId: string, options: { includeHidden: boolean }) => Promise<IArenaToken[]>;
  findById: (id: string) => Promise<IArenaToken | null>;
  /** Appends a token on top of the scene's others. */
  create: (sceneId: string, input: ICreateArenaTokenRow) => Promise<IArenaToken>;
  update: (id: string, input: IUpdateArenaTokenRow) => Promise<IArenaToken | null>;
  /** Moves a token; with a guard, only while it is still visible on that scene (null otherwise). */
  move: (id: string, x: number, y: number, guard?: IArenaMoveGuard) => Promise<IArenaToken | null>;
  remove: (id: string) => Promise<IRemovedArenaToken | null>;
  /** Swaps the NPC image key under a row lock and returns the token plus the key it replaced. */
  setImageKey: (
    id: string,
    key: string | null,
  ) => Promise<{ token: IArenaToken; previousKey: string | null } | null>;
}
