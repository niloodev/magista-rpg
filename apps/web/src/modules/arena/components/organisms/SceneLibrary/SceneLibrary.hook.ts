"use client";

import { childFolders, isErrorResult, type IArenaFolder, type IArenaScene } from "@magista/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { toMediaUrl } from "@/core/services/http";
import { ARENA_FOLDERS_STORAGE_KEY, SCENE_TEXTS } from "@/modules/arena/arena.constants";
import {
  createArenaFolder,
  createArenaScene,
  deleteArenaFolder,
  deleteArenaScene,
  fetchArenaLibrary,
  moveArenaLibraryItem,
  renameArenaFolder,
  renameArenaScene,
  uploadArenaSceneMap,
} from "@/modules/arena/services";
import type { ITreeMove } from "@/modules/library/library.types";
import { countLeavesDeep } from "@/modules/library/library.utils";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

import type { ISceneFormValues } from "../SceneFormDialog";
import type { SceneDialog, SceneLibraryProps } from "./SceneLibrary.types";
import { parseExpandedFolders, sceneFolderMenu, sceneMenu } from "./SceneLibrary.utils";

/**
 * The GM scene library: loads scenes and folders (again on every Arena change), keeps the open folders on
 * this device, moves items with drag and drop (shown at once, undone if the API refuses) and runs the
 * create, rename, map and delete dialogs. Opening a scene shows it on the GM screen only; "Colocar no ar"
 * shows it to the whole table.
 */
export function useSceneLibrary({ liveSceneId, onPreview, onGoLive }: SceneLibraryProps) {
  const store = useAppStoreApi();
  const socket = useTableSocket();
  const library = useApp((state) => state.arena.library);
  const expandedFolderIds = useApp((state) => state.arena.expandedFolderIds);
  const toggleFolder = useApp((state) => state.toggleArenaFolder);
  const expandFolders = useApp((state) => state.expandArenaFolders);
  const [dialog, setDialog] = useState<SceneDialog | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    store.getState().startArenaLibraryLoad();
    const result = await fetchArenaLibrary();
    if (seq !== loadSeq.current) return;
    if (isErrorResult(result)) store.getState().failArenaLibraryLoad(result.error);
    else store.getState().finishArenaLibraryLoad(result.payload);
  }, [store]);

  useEffect(() => {
    try {
      store
        .getState()
        .setArenaFolders(
          parseExpandedFolders(window.localStorage.getItem(ARENA_FOLDERS_STORAGE_KEY)),
        );
    } catch {
      store.getState().setArenaFolders([]);
    }
    void load();
  }, [load, store]);

  useEffect(() => {
    if (!socket) return;
    const onChange = () => void load();
    socket.on("arena:scene", onChange);
    return () => {
      socket.off("arena:scene", onChange);
    };
  }, [socket, load]);

  useEffect(() => {
    if (library.status !== "ready") return;
    try {
      window.localStorage.setItem(ARENA_FOLDERS_STORAGE_KEY, JSON.stringify(expandedFolderIds));
    } catch {
      return;
    }
  }, [expandedFolderIds, library.status]);

  const fail = (error: string) => {
    setNotice(error);
    void load();
  };

  const onMove = useCallback(
    async (move: ITreeMove) => {
      if (move.kind !== "folder" && move.kind !== "scene") return;
      const snapshot = store.getState().applyArenaLibraryMove(move);
      const result = await moveArenaLibraryItem({ ...move, kind: move.kind });
      if (!isErrorResult(result)) return;
      store.getState().restoreArenaLibrary(snapshot);
      setNotice(result.error);
      void load();
    },
    [store, load],
  );

  const folderSummary = useCallback(
    (folderId: string) =>
      SCENE_TEXTS.summary(
        countLeavesDeep({ folders: library.folders, leaves: library.scenes }, folderId),
        childFolders(library.folders, folderId).length,
      ),
    [library.folders, library.scenes],
  );

  const folderMenu = useCallback((folder: IArenaFolder) => sceneFolderMenu(folder, setDialog), []);

  const menuOf = (scene: IArenaScene) =>
    sceneMenu(scene, scene.id === liveSceneId, {
      open: setDialog,
      preview: onPreview,
      goLive: onGoLive,
    });

  const portraitOf = useCallback((scene: IArenaScene) => toMediaUrl(scene.mapUrl), []);

  const submitScene = async ({ name, file }: ISceneFormValues): Promise<string | null> => {
    if (dialog?.type !== "createScene") return null;
    const created = await createArenaScene(name, dialog.folderId);
    if (isErrorResult(created)) return created.error;
    if (dialog.folderId) expandFolders([dialog.folderId]);
    setDialog(null);
    onPreview(created.payload.id);
    if (file) {
      const uploaded = await uploadArenaSceneMap(created.payload.id, file);
      if (isErrorResult(uploaded)) setNotice(`${SCENE_TEXTS.mapNotSent} ${uploaded.error}`);
    }
    return null;
  };

  const submitFolder = async ({ name }: ISceneFormValues): Promise<string | null> => {
    if (dialog?.type === "createFolder") {
      const result = await createArenaFolder(name, dialog.parentId);
      if (isErrorResult(result)) return result.error;
      if (dialog.parentId) expandFolders([dialog.parentId]);
    } else if (dialog?.type === "renameFolder") {
      const result = await renameArenaFolder(dialog.folder.id, name);
      if (isErrorResult(result)) return result.error;
    }
    setDialog(null);
    return null;
  };

  const submitRename = async ({ name }: ISceneFormValues): Promise<string | null> => {
    if (dialog?.type !== "renameScene") return null;
    const result = await renameArenaScene(dialog.scene.id, name);
    if (isErrorResult(result)) return result.error;
    setDialog(null);
    return null;
  };

  const submitMap = async ({ file }: ISceneFormValues): Promise<string | null> => {
    if (dialog?.type !== "changeMap" || !file) return null;
    const result = await uploadArenaSceneMap(dialog.scene.id, file);
    if (isErrorResult(result)) return result.error;
    setDialog(null);
    return null;
  };

  const confirmDelete = async () => {
    const current = dialog;
    setDialog(null);
    if (current?.type === "deleteScene") {
      const result = await deleteArenaScene(current.scene.id);
      if (isErrorResult(result)) fail(result.error);
    } else if (current?.type === "deleteFolder") {
      const result = await deleteArenaFolder(current.folder.id);
      if (isErrorResult(result)) fail(result.error);
    }
  };

  return {
    status: library.status,
    error: library.error,
    scenes: library.scenes,
    folders: library.folders,
    expandedFolderIds,
    toggleFolder,
    expandFolders,
    onMove,
    folderSummary,
    folderMenu,
    menuOf,
    portraitOf,
    dialog,
    closeDialog: () => setDialog(null),
    newScene: () => setDialog({ type: "createScene", folderId: null }),
    newFolder: () => setDialog({ type: "createFolder", parentId: null }),
    notice,
    dismissNotice: () => setNotice(null),
    submitScene,
    submitFolder,
    submitRename,
    submitMap,
    confirmDelete: () => void confirmDelete(),
    retry: () => void load(),
  };
}
