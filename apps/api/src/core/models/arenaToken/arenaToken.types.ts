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

export interface IArenaTokenMove {
  tokenId: string;
  x: number;
  y: number;
}

export interface IArenaMoveGuard {
  sceneId: string;
}

export interface IArenaTokenModels {
  listByScene: (sceneId: string, options: { includeHidden: boolean }) => Promise<IArenaToken[]>;
  findById: (id: string) => Promise<IArenaToken | null>;
  findManyByIds: (ids: string[]) => Promise<IArenaToken[]>;
  /** Appends a token on top of the scene's others. */
  create: (sceneId: string, input: ICreateArenaTokenRow) => Promise<IArenaToken>;
  update: (id: string, input: IUpdateArenaTokenRow) => Promise<IArenaToken | null>;
  /** Moves several tokens in one transaction; with a guard, only those still visible on that scene. */
  moveMany: (moves: IArenaTokenMove[], guard?: IArenaMoveGuard) => Promise<IArenaToken[]>;
  remove: (id: string) => Promise<IRemovedArenaToken | null>;
  /** Applies several patches in one transaction and returns the tokens as stored (missing ids are skipped). */
  updateMany: (patches: { id: string; patch: IUpdateArenaTokenRow }[]) => Promise<IArenaToken[]>;
  /** Deletes several tokens in one transaction and returns what was removed. */
  removeMany: (ids: string[]) => Promise<IRemovedArenaToken[]>;
  /** Swaps the NPC image key under a row lock and returns the token plus the key it replaced. */
  setImageKey: (
    id: string,
    key: string | null,
  ) => Promise<{ token: IArenaToken; previousKey: string | null } | null>;
}
