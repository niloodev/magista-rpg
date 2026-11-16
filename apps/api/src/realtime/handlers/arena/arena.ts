import { isErrorResult } from "@magista/shared";

import { arenaController } from "@/core/controllers/arena";

import { ARENA_CHANGE_THROTTLED_ERROR, ARENA_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { arenaChangeGateFor, arenaMoveGateFor } from "../../realtime.utils";
import type { IArenaHandlerCallbacks } from "./arena.types";

/**
 * Token movement in the Arena: only the final position is stored, acknowledged and sent to the others (who
 * see the token glide there, or snap to it in performance mode), after the controller's access check.
 * Damage and healing ("Aplicar mudança") come from anyone who sees the tokens, with their own rate limit.
 */
export function registerArenaHandlers(
  socket: RealtimeSocket,
  { onMoved, onChanged }: IArenaHandlerCallbacks,
): void {
  socket.on("arena:apply", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!arenaChangeGateFor(accountId)()) {
      ack({ error: ARENA_CHANGE_THROTTLED_ERROR });
      return;
    }
    const result = await arenaController.applyChange({ accountId, role }, request);
    if (isErrorResult(result)) {
      ack(result);
      return;
    }
    ack({ message: result.message, payload: result.payload.result });
    onChanged(result.payload);
  });

  socket.on("arena:move", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!arenaMoveGateFor(accountId)()) {
      ack({ error: ARENA_THROTTLED_ERROR });
      return;
    }
    const result = await arenaController.move({ accountId, role }, request);
    if (isErrorResult(result)) {
      ack(result);
      return;
    }
    const { changes, refused } = result.payload;
    ack({
      message: result.message,
      payload: { tokens: changes.map((change) => change.token), refused },
    });
    onMoved(changes);
  });
}
