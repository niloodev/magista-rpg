import type { IArenaBoardRequest, IArenaBounds, IArenaScene } from "@magista/shared";

export interface IArenaSceneMapChange {
  scene: IArenaScene;
  previousKey: string | null;
}

export interface IArenaSceneModels {
  list: () => Promise<IArenaScene[]>;
  findById: (id: string) => Promise<IArenaScene | null>;
  /** Appends a scene after the others of its folder (null is the root). */
  create: (name: string, folderId: string | null) => Promise<IArenaScene>;
  rename: (id: string, name: string) => Promise<IArenaScene | null>;
  /** Deletes the scene (its tokens go with it); returns the ids of its tokens for media cleanup, or null when missing. */
  remove: (id: string) => Promise<{ tokenIds: string[] } | null>;
  /**
   * Swaps the map under a row lock and returns the scene plus the key it replaced, or null when missing. A scene
   * that already had a board keeps its width (the height follows the new map); a new one takes the map's natural
   * size. Tokens follow the map.
   */
  setMapKey: (id: string, key: string, size: IArenaBounds) => Promise<IArenaSceneMapChange | null>;
  /** Resizes the board (keeping the map's aspect ratio) and moves the tokens with the map; null when missing. */
  setBoard: (id: string, request: IArenaBoardRequest) => Promise<IArenaScene | null>;
  /** Records the natural size of a map measured after the fact (scenes from before it was stored). */
  setMapSize: (id: string, size: IArenaBounds) => Promise<IArenaScene | null>;
  /** Scenes with a map whose natural size was never stored. */
  findUnmeasuredMaps: () => Promise<{ id: string; mapKey: string }[]>;
  /** Board of each scene found, by id. */
  findBoards: (ids: string[]) => Promise<Map<string, IArenaBounds>>;
  findActiveSceneId: () => Promise<string | null>;
  setActiveScene: (id: string | null) => Promise<void>;
}
