import type { IArenaFolder, IArenaScene } from "@magista/shared";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import type { ActionMenuItem } from "@/shared/components/molecules";

import type { SceneDialog } from "./SceneLibrary.types";

/**
 * Actions of a scene: open it on the GM screen, put it live, rename, change the map or delete.
 */
export function sceneMenu(
  scene: IArenaScene,
  live: boolean,
  handlers: {
    open: (dialog: SceneDialog) => void;
    preview: (sceneId: string) => void;
    goLive: (sceneId: string) => void;
  },
): ActionMenuItem[] {
  return [
    { label: SCENE_TEXTS.open, icon: "eye", onSelect: () => handlers.preview(scene.id) },
    ...(live
      ? []
      : [
          {
            label: SCENE_TEXTS.goLive,
            icon: "zap" as const,
            onSelect: () => handlers.goLive(scene.id),
          },
        ]),
    {
      label: SCENE_TEXTS.rename,
      icon: "pen-line",
      onSelect: () => handlers.open({ type: "renameScene", scene }),
    },
    {
      label: SCENE_TEXTS.changeMap,
      icon: "image",
      onSelect: () => handlers.open({ type: "changeMap", scene }),
    },
    {
      label: SCENE_TEXTS.board,
      icon: "ruler",
      onSelect: () => handlers.open({ type: "board", scene }),
    },
    {
      label: SCENE_TEXTS.remove,
      icon: "trash-2",
      destructive: true,
      onSelect: () => handlers.open({ type: "deleteScene", scene }),
    },
  ];
}

/**
 * Actions of a scene folder: create inside it, rename or delete (its content moves up).
 */
export function sceneFolderMenu(
  folder: IArenaFolder,
  open: (dialog: SceneDialog) => void,
): ActionMenuItem[] {
  return [
    {
      label: SCENE_TEXTS.newSceneHere,
      icon: "map",
      onSelect: () => open({ type: "createScene", folderId: folder.id }),
    },
    {
      label: SCENE_TEXTS.newFolderHere,
      icon: "folder-plus",
      onSelect: () => open({ type: "createFolder", parentId: folder.id }),
    },
    {
      label: SCENE_TEXTS.rename,
      icon: "pen-line",
      onSelect: () => open({ type: "renameFolder", folder }),
    },
    {
      label: SCENE_TEXTS.remove,
      icon: "trash-2",
      destructive: true,
      onSelect: () => open({ type: "deleteFolder", folder }),
    },
  ];
}

/**
 * Reads the expanded folders saved on this device, ignoring anything malformed.
 */
export function parseExpandedFolders(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
