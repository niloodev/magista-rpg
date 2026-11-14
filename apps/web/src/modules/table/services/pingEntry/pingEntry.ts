import { isErrorResult, type ControllerResult, type IRollResult } from "@magista/shared";

import { TABLE_ACK_TIMEOUT_MS, TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import type { PingEntryInput, PingEntryResult } from "./pingEntry.types";

/**
 * Shows a trait or an inventory item to the whole table (no dice); the card arrives right away via "roll:result".
 */
export async function pingEntry({ socket, request }: PingEntryInput): Promise<PingEntryResult> {
  if (!socket?.connected) return { ok: false, error: TABLE_OFFLINE_ERROR };
  try {
    const result: ControllerResult<IRollResult> = await socket
      .timeout(TABLE_ACK_TIMEOUT_MS)
      .emitWithAck("sheet:ping", request);
    return isErrorResult(result) ? { ok: false, error: result.error } : { ok: true };
  } catch {
    return { ok: false, error: TABLE_OFFLINE_ERROR };
  }
}
