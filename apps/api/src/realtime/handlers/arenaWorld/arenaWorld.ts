import { isErrorResult } from "@magista/shared";

import { arenaWorldController } from "@/core/controllers/arenaWorld";

import { ARENA_THROTTLED_ERROR, ARENA_WORLD_PAINT_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { arenaMoveGateFor, arenaWorldPaintGateFor } from "../../realtime.utils";
import type { IArenaWorldHandlerCallbacks } from "./arenaWorld.types";

/**
 * The world map: moving the party token (any player while it is live, the GM always) and painting the fog (GM),
 * each with its own rate limit; the controller checks who may do what.
 */
export function registerArenaWorldHandlers(
  socket: RealtimeSocket,
  { onPartyMoved, onFogChanged }: IArenaWorldHandlerCallbacks,
): void {
  socket.on("arena:world-move", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!arenaMoveGateFor(accountId)()) {
      ack({ error: ARENA_THROTTLED_ERROR });
      return;
    }
    const result = await arenaWorldController.moveParty({ accountId, role }, request);
    if (isErrorResult(result)) {
      ack(result);
      return;
    }
    ack({ message: result.message, payload: result.payload.value });
    onPartyMoved(result.payload);
  });

  socket.on("arena:world-paint", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    if (!arenaWorldPaintGateFor(accountId)()) {
      ack({ error: ARENA_WORLD_PAINT_THROTTLED_ERROR });
      return;
    }
    const result = await arenaWorldController.paintFog({ accountId, role }, request);
    if (isErrorResult(result)) {
      ack(result);
      return;
    }
    ack({ message: result.message, payload: result.payload.value });
    onFogChanged(result.payload);
  });
}
