import {
  ARENA_IMAGE_FIELD,
  type ControllerResult,
  type IArenaBoardInput,
  type IArenaFolder,
  type IArenaLibrary,
  type IArenaScene,
  type IMoveArenaLibraryItemInput,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Scenes and scene folders of the GM library.
 */
export function fetchArenaLibrary(): Promise<ControllerResult<IArenaLibrary>> {
  return apiRequest<IArenaLibrary>("/arena/library");
}

/**
 * Creates an empty scene (no map yet) at the end of a folder (null is the root).
 */
export function createArenaScene(
  name: string,
  folderId: string | null,
): Promise<ControllerResult<IArenaScene>> {
  return apiRequest<IArenaScene>("/arena/scenes", { method: "POST", body: { name, folderId } });
}

/**
 * Sends a new map image for a scene (replaces the previous one).
 */
export function uploadArenaSceneMap(
  sceneId: string,
  file: File,
): Promise<ControllerResult<unknown>> {
  const formData = new FormData();
  formData.append(ARENA_IMAGE_FIELD, file);
  return apiRequest(`/arena/scenes/${sceneId}/map`, { method: "PUT", formData });
}

export function setArenaSceneBoard(
  sceneId: string,
  board: IArenaBoardInput,
): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/scenes/${sceneId}/board`, { method: "PUT", body: board });
}

export function renameArenaScene(
  sceneId: string,
  name: string,
): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/scenes/${sceneId}`, { method: "PATCH", body: { name } });
}

export function deleteArenaScene(sceneId: string): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/scenes/${sceneId}`, { method: "DELETE" });
}

/**
 * Puts a scene live for the whole table (null takes the Arena off the air).
 */
export function setArenaLiveScene(sceneId: string | null): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/active", { method: "PUT", body: { sceneId } });
}

export function createArenaFolder(
  name: string,
  parentId: string | null,
): Promise<ControllerResult<IArenaFolder>> {
  return apiRequest<IArenaFolder>("/arena/folders", { method: "POST", body: { name, parentId } });
}

export function renameArenaFolder(
  folderId: string,
  name: string,
): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/folders/${folderId}`, { method: "PATCH", body: { name } });
}

/**
 * Deletes a folder; its scenes and subfolders move up to the parent.
 */
export function deleteArenaFolder(folderId: string): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/folders/${folderId}`, { method: "DELETE" });
}

export function moveArenaLibraryItem(
  move: IMoveArenaLibraryItemInput,
): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/library/move", { method: "POST", body: move });
}
