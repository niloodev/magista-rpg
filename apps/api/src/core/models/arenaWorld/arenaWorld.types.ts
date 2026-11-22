import type { IWorldPoint } from "@magista/shared";

/** The world map as stored: whether it is live, the party position and the fog bitset. */
export interface IArenaWorldState {
  live: boolean;
  activeSceneId: string | null;
  party: IWorldPoint;
  fog: Uint8Array;
  fogVersion: number;
}

export interface IArenaWorldModels {
  /** The stored world map (defaults when the arena state row does not exist yet). */
  findWorld: () => Promise<IArenaWorldState>;
  setLive: (live: boolean) => Promise<IArenaWorldState>;
  moveParty: (party: IWorldPoint) => Promise<IArenaWorldState>;
  /** Changes the fog under a row lock (so two GM tabs never lose a stroke) and bumps its version. */
  changeFog: (apply: (fog: Uint8Array) => Uint8Array) => Promise<IArenaWorldState>;
}

/** The columns of the arena state row that hold the world map. */
export interface ArenaWorldRow {
  worldMapLive: boolean;
  activeSceneId: string | null;
  partyX: number;
  partyY: number;
  fogMask: Uint8Array | null;
  fogVersion: number;
}
