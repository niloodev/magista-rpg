import {
  isErrorResult,
  type ControllerResult,
  type IArenaWorldFogEvent,
  type IMoveWorldPartyInput,
  type IPaintWorldFogInput,
  type IWorldPoint,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { TableSocket } from "@/core/services/socket";
import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import type { MoveWorldPartyResult, PaintWorldFogResult } from "./arenaWorldRequests.types";

/**
 * Puts the world map live in place of the live scene, or takes it off the air (GM). The table refetches the Arena.
 */
export function setArenaWorldLive(live: boolean): Promise<ControllerResult<unknown>> {
  return apiRequest("/arena/world/live", { method: "PUT", body: { live } });
}

/**
 * Moves the party token on the world map; the others receive it via "arena:world-party".
 */
export async function moveWorldParty(
  socket: TableSocket | null,
  request: IMoveWorldPartyInput,
): Promise<MoveWorldPartyResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IWorldPoint> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:world-move", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, party: result.payload };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}

/**
 * Paints the world map fog with a brush batch, or covers or clears it whole (GM).
 */
export async function paintWorldFog(
  socket: TableSocket | null,
  request: IPaintWorldFogInput,
): Promise<PaintWorldFogResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IArenaWorldFogEvent> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("arena:world-paint", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, fog: result.payload };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}
