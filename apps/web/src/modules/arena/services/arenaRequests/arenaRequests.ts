import {
  isErrorResult,
  type ControllerResult,
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
 * Applies size, visibility or name changes to several tokens (GM); the table receives each one via "arena:token".
 */
export function updateArenaTokens(updates: IArenaTokenPatch[]): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/tokens", { method: "PATCH", body: { updates } });
}

/**
 * Removes several tokens (GM); the table receives each removal via "arena:token-removed".
 */
export function deleteArenaTokens(ids: string[]): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/tokens", { method: "DELETE", body: { ids } });
}

/**
 * Stores the final position of one or more tokens; the others receive each one via "arena:token". Tokens the
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
 * Shares a live drag position with the others (fire and forget; dropped when the connection is busy).
 */
export function emitArenaDrag(socket: TableSocket | null, request: IMoveArenaTokensInput): void {
  if (socket?.connected) socket.volatile.emit("arena:drag", request);
}
