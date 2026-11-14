import { isErrorResult, type ControllerResult, type IRollResult } from "@magista/shared";

import { ROLL_OFFLINE_ERROR, ROLL_TIMEOUT_MS } from "./requestRoll.constants";
import type { RequestRollInput, RequestRollResult } from "./requestRoll.types";

/**
 * Asks the server to roll. The roller gets the result at once (to animate); the table receives it later via "roll:result".
 */
export async function requestRoll({
  socket,
  request,
}: RequestRollInput): Promise<RequestRollResult> {
  if (!socket?.connected) return { ok: false, error: ROLL_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IRollResult> = await socket
      .timeout(ROLL_TIMEOUT_MS)
      .emitWithAck("roll:request", request);
    return isErrorResult(result)
      ? { ok: false, error: result.error }
      : { ok: true, roll: result.payload };
  } catch {
    return { ok: false, error: ROLL_OFFLINE_ERROR };
  }
}
