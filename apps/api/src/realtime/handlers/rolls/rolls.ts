import { isErrorResult } from "@magista/shared";

import { rollController } from "@/core/controllers/roll";

import { ROLL_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { gateFor } from "../../realtime.utils";
import type { IRollHandlerCallbacks } from "./rolls.types";

/**
 * Rolls on the server and answers the roller at once (to animate); the table only sees it once the animation reveals it.
 * Pings (a trait or item shown to the table) go out at once. Both share the per-account throttle (all of its sockets)
 * so nobody can flood the table.
 */
export function registerRollHandlers(
  socket: RealtimeSocket,
  { onRolled, onPinged }: IRollHandlerCallbacks,
): void {
  socket.on("roll:request", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!gateFor(accountId)()) {
      ack({ error: ROLL_THROTTLED_ERROR });
      return;
    }
    const result = await rollController.roll({ accountId, role }, request);
    ack(result);
    if (!isErrorResult(result)) onRolled(result.payload);
  });

  socket.on("sheet:ping", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!gateFor(accountId)()) {
      ack({ error: ROLL_THROTTLED_ERROR });
      return;
    }
    const result = await rollController.ping({ accountId, role }, request);
    ack(result);
    if (!isErrorResult(result)) onPinged(result.payload);
  });
}
