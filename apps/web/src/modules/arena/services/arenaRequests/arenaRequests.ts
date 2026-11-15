import {
  isErrorResult,
  type ControllerResult,
  type IArenaToken,
  type IArenaView,
  type IMoveArenaTokenInput,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { TableSocket } from "@/core/services/socket";
import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import type { MoveArenaTokenResult } from "./arenaRequests.types";

/**
 * Loads what this account sees in the Arena: the live scene (the GM may ask for another one) and its tokens.
 */
export function fetchArena(sceneId?: string): Promise<ControllerResult<IArenaView>> {
  const query = sceneId ? `?sceneId=${encodeURIComponent(sceneId)}` : "";
  return apiRequest<IArenaView>(`/arena${query}`);
}

/**
 * Stores the final position of a token; the others receive it via "arena:token".
 */
export async function moveArenaToken(
  socket: TableSocket | null,
  request: IMoveArenaTokenInput,
): Promise<MoveArenaTokenResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IArenaToken> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:move", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, token: result.payload };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}

/**
 * Shares a live drag position with the others (fire and forget; dropped when the connection is busy).
 */
export function emitArenaDrag(socket: TableSocket | null, request: IMoveArenaTokenInput): void {
  if (socket?.connected) socket.volatile.emit("arena:drag", request);
}
