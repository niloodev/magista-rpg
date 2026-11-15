import { isErrorResult } from "@magista/shared";

import { ROLL_THROTTLED_ERROR } from "../../realtime.constants";
import type { RealtimeSocket } from "../../realtime.types";
import { gateFor } from "../../realtime.utils";
import type { IMarkedHandlerDeps } from "./marked.types";

/**
 * Trait sharing of the Marca: proposals reach every Marcado (and the GM), each answer updates them, and
 * the proposal expires on its own deadline. Proposing, cancelling and stopping share the per-account table
 * throttle; answers do not (the GM may answer for several NPCs in a row, and each sheet answers once).
 */
export function registerMarkedHandlers(
  socket: RealtimeSocket,
  { controller, onProposal, onResolved, onShare }: IMarkedHandlerDeps,
): void {
  const viewer = () => {
    const { accountId, role } = socket.data.member;
    return { accountId, role };
  };
  const throttled = () => !gateFor(socket.data.member.accountId)();

  socket.on("marked:propose", async (request, ack) => {
    if (typeof ack !== "function") return;
    if (throttled()) return ack({ error: ROLL_THROTTLED_ERROR });
    const result = await controller.propose(viewer(), request);
    if (isErrorResult(result)) return ack(result);
    const { proposal } = result.payload;
    ack({ message: result.message, payload: proposal });
    onProposal(result.payload);
    const delay = Math.max(0, new Date(proposal.expiresAt).getTime() - Date.now());
    setTimeout(() => {
      void controller.expire(proposal.id).then((expired) => expired && onResolved(expired));
    }, delay);
  });

  socket.on("marked:answer", async (request, ack) => {
    if (typeof ack !== "function") return;
    const result = await controller.answer(viewer(), request);
    if (isErrorResult(result)) return ack(result);
    const { proposal, resolution, share, characterIds } = result.payload;
    ack({ message: result.message, payload: proposal });
    onProposal({ proposal, characterIds });
    if (resolution) onResolved({ resolution, characterIds });
    if (share) onShare(share, { characterIds });
  });

  socket.on("marked:cancel", async (request, ack) => {
    if (typeof ack !== "function") return;
    if (throttled()) return ack({ error: ROLL_THROTTLED_ERROR });
    const result = await controller.cancel(viewer(), request);
    if (isErrorResult(result)) return ack(result);
    ack({ message: result.message, payload: null });
    onResolved(result.payload);
  });

  socket.on("marked:stop", async (request, ack) => {
    if (typeof ack !== "function") return;
    if (throttled()) return ack({ error: ROLL_THROTTLED_ERROR });
    const result = await controller.stop(viewer(), request);
    if (isErrorResult(result)) return ack(result);
    ack({ message: result.message, payload: null });
    onShare(null, result.payload);
  });
}
