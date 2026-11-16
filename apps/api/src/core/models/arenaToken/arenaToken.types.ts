import type {
  ArenaResourceKey,
  IArenaToken,
  IArenaTokenStatus,
  IArenaTokenStatusAccess,
  ISheetResource,
} from "@magista/shared";

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
  healthCurrent?: number | null;
  healthMax?: number | null;
  sanityCurrent?: number | null;
  sanityMax?: number | null;
  statusPublic?: boolean;
  /** Replaces the player accounts allowed to see the status. */
  statusViewerIds?: string[];
}

/** Status of a token (from its sheet or its own columns) plus who may see it. */
export interface IArenaTokenStatusRow {
  id: string;
  sceneId: string;
  characterId: string | null;
  hidden: boolean;
  status: IArenaTokenStatus;
  access: IArenaTokenStatusAccess;
}

/** Which tokens to read the status of. */
export type ArenaStatusQuery =
  | { sceneId: string; includeHidden: boolean }
  | { ids: string[] }
  | { characterIds: string[]; sceneId: string };

/** Computes the new value of a resource, or null to leave it as it is. */
export type ResourceChange = (resource: ISheetResource) => ISheetResource | null;

export interface IRemovedArenaToken {
  id: string;
  sceneId: string;
  hidden: boolean;
  /** Its own image (NPC), to let go of the asset. */
  imageKey: string | null;
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
  /** Moves several tokens in one statement; with a guard, only those still visible on that scene. */
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
  /** Status and status permissions of tokens (a character token reads only the resources of its sheet). */
  listStatuses: (query: ArenaStatusQuery) => Promise<IArenaTokenStatusRow[]>;
  /** Changes one resource of NPC tokens under a row lock and returns the ids that changed. */
  changeNpcResource: (
    ids: string[],
    resource: ArenaResourceKey,
    change: ResourceChange,
  ) => Promise<string[]>;
}
