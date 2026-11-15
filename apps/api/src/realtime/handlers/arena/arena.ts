import { isErrorResult } from "@magista/shared";

import { arenaController } from "@/core/controllers/arena";

import { ARENA_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { arenaDragGateFor, arenaMoveGateFor } from "../../realtime.utils";
import type { IArenaHandlerCallbacks } from "./arena.types";

/**
 * Token movement in the Arena. Drag previews are relayed to the others without being stored (extra previews
 * are dropped); the final move is stored and acknowledged. Both go through the controller's access check.
 */
export function registerArenaHandlers(
  socket: RealtimeSocket,
  { onMoved, onDragged }: IArenaHandlerCallbacks,
): void {
  socket.on("arena:drag", async (request) => {
    const { accountId, role } = socket.data.member;
    if (!arenaDragGateFor(accountId)()) return;
    const result = await arenaController.drag({ accountId, role }, request);
    if (!isErrorResult(result)) onDragged(result.payload, socket.id);
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
    ack({ message: result.message, payload: result.payload.token });
    onMoved(result.payload);
  });
}
