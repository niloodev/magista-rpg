import {
  ARENA_IMAGE_FIELD,
  isErrorResult,
  type ControllerResult,
  type IArenaToken,
  type ICopyArenaTokensInput,
  type ICreateArenaTokenInput,
  type IArenaMoveResult,
  type IArenaTokenPatch,
  type IArenaView,
  type IMoveArenaTokensInput,
  type IAccount,
  type IApplyArenaChangeInput,
  type IArenaChangeResult,
  type IArenaTurnCommand,
  type IArenaTurnOrder,
  type IUpdateArenaTokenInput,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { TableSocket } from "@/core/services/socket";
import { ARENA_WORLD_VIEW } from "@/modules/arena/arena.constants";
import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import type {
  ApplyArenaChangeResult,
  ArenaTurnCommandResult,
  MoveArenaTokensResult,
} from "./arenaRequests.types";

/**
 * Loads what this account sees in the Arena: the live scene or the world map (the GM may ask for another scene,
 * or for the world map with `ARENA_WORLD_VIEW`) and its tokens.
 */
export function fetchArena(sceneId?: string): Promise<ControllerResult<IArenaView>> {
  const query =
    sceneId === ARENA_WORLD_VIEW
      ? "?world=1"
      : sceneId
        ? `?sceneId=${encodeURIComponent(sceneId)}`
        : "";
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
 * Pastes copies of tokens (from any scene) into a scene (GM); the copies come back in the order asked.
 */
export function copyArenaTokens(
  sceneId: string,
  input: ICopyArenaTokensInput,
): Promise<ControllerResult<{ token: IArenaToken }[]>> {
  return apiRequest<{ token: IArenaToken }[]>(`/arena/scenes/${sceneId}/tokens/copy`, {
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
 * Takes the own image off an NPC token (GM).
 */
export function removeArenaTokenImage(tokenId: string): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/tokens/${tokenId}/image`, { method: "DELETE" });
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

/**
 * Saves the settings of one token (GM): own health and sanity (NPC) and who may see them.
 */
export function updateArenaToken(
  tokenId: string,
  input: IUpdateArenaTokenInput,
): Promise<ControllerResult<unknown>> {
  return apiRequest(`/arena/tokens/${tokenId}`, { method: "PATCH", body: input });
}

/**
 * The accounts of the table (GM), to choose who sees a token status.
 */
export function fetchArenaAccounts(): Promise<ControllerResult<IAccount[]>> {
  return apiRequest<IAccount[]>("/accounts");
}

/**
 * Applies damage or healing to tokens; everyone who sees them gets the animation in "arena:effect" and the new
 * status only if they may see it.
 */
export async function applyArenaChange(
  socket: TableSocket | null,
  request: IApplyArenaChangeInput,
): Promise<ApplyArenaChangeResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IArenaChangeResult> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:apply", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, applied: result.payload.applied, refused: result.payload.refused };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}

/**
 * Sends a turn order command (pass the turn, add, roll, edit); the order this account sees comes back in the ack,
 * everyone else gets it in "arena:turns".
 */
export async function sendArenaTurnCommand(
  socket: TableSocket | null,
  command: IArenaTurnCommand,
): Promise<ArenaTurnCommandResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IArenaTurnOrder> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:turn", command);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, order: result.payload };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}
