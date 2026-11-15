import {
  ARENA_IMAGE_FIELD,
  isErrorResult,
  type ControllerResult,
  type IArenaToken,
  type ICreateArenaTokenInput,
  type IArenaMoveResult,
  type IArenaTokenPatch,
  type IArenaView,
  type IMoveArenaTokensInput,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { TableSocket } from "@/core/services/socket";
import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import type { MoveArenaTokensResult } from "./arenaRequests.types";

/**
 * Loads what this account sees in the Arena: the live scene (the GM may ask for another one) and its tokens.
 */
export function fetchArena(sceneId?: string): Promise<ControllerResult<IArenaView>> {
  const query = sceneId ? `?sceneId=${encodeURIComponent(sceneId)}` : "";
  return apiRequest<IArenaView>(`/arena${query}`);
}

/**
 * Creates a token on a scene (GM): a sheet token (`characterId`) or an NPC (`name`), at a map point. The table
 * receives it via "arena:token".
 */
export function createArenaToken(
  sceneId: string,
  input: ICreateArenaTokenInput,
): Promise<ControllerResult<{ token: IArenaToken }>> {
  return apiRequest<{ token: IArenaToken }>(`/arena/scenes/${sceneId}/tokens`, {
    method: "POST",
    body: input,
  });
}

/**
 * Sends the image of an NPC token (GM).
 */
export function uploadArenaTokenImage(
  tokenId: string,
  file: File,
): Promise<ControllerResult<unknown>> {
  const formData = new FormData();
  formData.append(ARENA_IMAGE_FIELD, file);
  return apiRequest(`/arena/tokens/${tokenId}/image`, { method: "PUT", formData });
}

/**
 * Applies size, visibility or name changes to several tokens (GM); the table receives them in one "arena:tokens" (or "arena:token" for a single one).
 */
export function updateArenaTokens(updates: IArenaTokenPatch[]): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/tokens", { method: "PATCH", body: { updates } });
}

/**
 * Removes several tokens (GM); the table receives them in one "arena:tokens-removed" (or "arena:token-removed" for a single one).
 */
export function deleteArenaTokens(ids: string[]): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/tokens", { method: "DELETE", body: { ids } });
}

/**
 * Stores the final position of one or more tokens; the others receive them in one "arena:tokens" (or "arena:token" for a single one). Tokens the
 * account may not move come back in `refused`.
 */
export async function moveArenaTokens(
  socket: TableSocket | null,
  request: IMoveArenaTokensInput,
): Promise<MoveArenaTokensResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IArenaMoveResult> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:move", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, tokens: result.payload.tokens, refused: result.payload.refused };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}
