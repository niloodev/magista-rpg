import {
  isErrorResult,
  type ControllerResult,
  type ICharacterSummary,
  type IMarkedAnswerInput,
  type IMarkedProposeInput,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { TableSocket } from "@/core/services/socket";
import type { MarkedActionResult } from "@/modules/marked/marked.types";
import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

type MarkedEmit = (socket: TableSocket) => Promise<ControllerResult<unknown>>;

async function emitMarked(
  socket: TableSocket | null,
  emit: MarkedEmit,
): Promise<MarkedActionResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result = await emit(socket);
    return isErrorResult(result) ? { ok: false, error: result.error } : { ok: true };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}

/**
 * Asks every other Marcado to accept a trait of this sheet; the proposal arrives to all via "marked:proposal".
 */
export function proposeMarkedShare(
  socket: TableSocket | null,
  request: IMarkedProposeInput,
): Promise<MarkedActionResult> {
  return emitMarked(socket, (live) =>
    live.timeout(TABLE_ACK_TIMEOUT_MS).emitWithAck("marked:propose", request),
  );
}

/**
 * Accepts or refuses a proposal on behalf of one Marcado sheet.
 */
export function answerMarkedShare(
  socket: TableSocket | null,
  request: IMarkedAnswerInput,
): Promise<MarkedActionResult> {
  return emitMarked(socket, (live) =>
    live.timeout(TABLE_ACK_TIMEOUT_MS).emitWithAck("marked:answer", request),
  );
}

/**
 * Withdraws a pending proposal (its source or the GM).
 */
export function cancelMarkedShare(
  socket: TableSocket | null,
  proposalId: string,
): Promise<MarkedActionResult> {
  return emitMarked(socket, (live) =>
    live.timeout(TABLE_ACK_TIMEOUT_MS).emitWithAck("marked:cancel", { proposalId }),
  );
}

/**
 * Ends the active Marca share (its source or the GM).
 */
export function stopMarkedShare(
  socket: TableSocket | null,
  shareId: string,
): Promise<MarkedActionResult> {
  return emitMarked(socket, (live) =>
    live.timeout(TABLE_ACK_TIMEOUT_MS).emitWithAck("marked:stop", { shareId }),
  );
}

/**
 * Ids of the characters granted to this account, to know which Marcados it answers for.
 */
export async function fetchOwnCharacterIds(): Promise<ControllerResult<string[]>> {
  const result = await apiRequest<ICharacterSummary[]>("/characters");
  if (isErrorResult(result)) return result;
  return { message: result.message, payload: result.payload.map((character) => character.id) };
}
