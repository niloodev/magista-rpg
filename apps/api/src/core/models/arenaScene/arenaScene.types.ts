import type { IArenaScene } from "@magista/shared";

export interface IArenaSceneMapChange {
  scene: IArenaScene;
  previousKey: string | null;
}

export interface IArenaSceneModels {
  list: () => Promise<IArenaScene[]>;
  findById: (id: string) => Promise<IArenaScene | null>;
  /** Appends a scene after the existing ones. */
  create: (name: string) => Promise<IArenaScene>;
  rename: (id: string, name: string) => Promise<IArenaScene | null>;
  /** Deletes the scene (its tokens go with it); returns the ids of its tokens for media cleanup, or null when missing. */
  remove: (id: string) => Promise<{ tokenIds: string[] } | null>;
  /** Swaps the map key under a row lock and returns the scene plus the key it replaced, or null when missing. */
  setMapKey: (id: string, key: string | null) => Promise<IArenaSceneMapChange | null>;
  findActiveSceneId: () => Promise<string | null>;
  setActiveScene: (id: string | null) => Promise<void>;
}
