import type { IArenaFolder, IArenaScene } from "@magista/shared";

export interface SceneLibraryProps {
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
