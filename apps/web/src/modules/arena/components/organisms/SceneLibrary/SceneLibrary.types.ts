import type { IArenaFolder, IArenaScene } from "@magista/shared";

import type { WorldMapRowProps } from "../../molecules";

export interface SceneLibraryProps {
  /** The world map row pinned above the scenes. */
  world: Omit<WorldMapRowProps, "inert">;
  liveSceneId: string | null;
  viewingSceneId: string | null;
  onPreview: (sceneId: string) => void;
  onGoLive: (sceneId: string) => void;
}

export type SceneDialog =
  | { type: "createScene"; folderId: string | null }
  | { type: "createFolder"; parentId: string | null }
  | { type: "renameScene"; scene: IArenaScene }
  | { type: "changeMap"; scene: IArenaScene }
  | { type: "board"; scene: IArenaScene }
  | { type: "deleteScene"; scene: IArenaScene }
  | { type: "renameFolder"; folder: IArenaFolder }
  | { type: "deleteFolder"; folder: IArenaFolder };
