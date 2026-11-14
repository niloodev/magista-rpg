import { isErrorResult, type IRollResult } from "@magista/shared";

import { rollController } from "@/core/controllers/roll";

import {
  ROLL_BURST_LIMIT,
  ROLL_BURST_WINDOW_MS,
  ROLL_THROTTLED_ERROR,
} from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { createRateGate } from "../../realtime.utils";

const gates = new Map<string, () => boolean>();

function gateFor(accountId: string): () => boolean {
  const existing = gates.get(accountId);
  if (existing) return existing;
  const gate = createRateGate(ROLL_BURST_LIMIT, ROLL_BURST_WINDOW_MS);
  gates.set(accountId, gate);
  return gate;
}

/**
 * Rolls on the server and answers the roller at once (to animate); the table only sees it once the animation reveals it.
 * Throttled per account (shared by all of its sockets) so nobody can flood the table.
 */
export function registerRollHandlers(
  socket: RealtimeSocket,
  onRolled: (roll: IRollResult) => void,
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
}
