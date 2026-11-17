import { isErrorResult, type IRollResult } from "@magista/shared";

import { arenaTurnController, arenaTurnErrors } from "@/core/controllers/arenaTurn";
import { rollController } from "@/core/controllers/roll";

import { ARENA_TURN_THROTTLED_ERROR, ROLL_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { arenaTurnGateFor, gateFor, groupByCharacter, withinGate } from "../../realtime.utils";
import { withoutRefused } from "./arenaTurn.utils";
import type { IArenaTurnHandlerCallbacks } from "./arenaTurn.types";

/**
 * Turn order commands: the sender gets the order it may see in the ack, everyone else through `arena:turns`.
 * Rolling from the token menu rolls each character token as its sheet initiative (for that token only, in the
 * feed) and each NPC in secret; the values reach the order when the dice reveal.
 */
export function registerArenaTurnHandlers(
  socket: RealtimeSocket,
  { onTurns, onRolling }: IArenaTurnHandlerCallbacks,
): void {
  socket.on("arena:turn", async (request, ack) => {
    if (typeof ack !== "function") return;
    const { accountId, role } = socket.data.member;
    const viewer = { accountId, role };
    if (!arenaTurnGateFor(accountId)()) {
      ack({ error: ARENA_TURN_THROTTLED_ERROR });
      return;
    }
    const result = await arenaTurnController.command(viewer, request);
    if (isErrorResult(result)) {
      ack(result);
      return;
    }
    const { delivery, changed, rolls } = result.payload;
    const own = role === "GM" ? delivery.gm : delivery.table;
    if (changed) onTurns(delivery);
    if (!rolls) {
      ack(
        own ? { message: result.message, payload: own } : { error: arenaTurnErrors.sceneNotFound },
      );
      return;
    }
    const accepted =
      role === "GM" ? rolls.characters : withinGate(rolls.characters, gateFor(accountId));
    const refused = new Set(rolls.characters.slice(accepted.length).map((roll) => roll.tokenId));
    ack(
      refused.size > 0 || !own
        ? { error: refused.size > 0 ? ROLL_THROTTLED_ERROR : arenaTurnErrors.sceneNotFound }
        : { message: result.message, payload: own },
    );
    const results: IRollResult[] = [];
    for (const [characterId, tokenIds] of groupByCharacter(accepted)) {
      results.push(...(await rollController.rollInitiatives(viewer, characterId, tokenIds)));
    }
    onRolling(withoutRefused(rolls, accepted, refused), results);
  });
}
