import type { IRollRequest, IRollResult } from "@magista/shared";

import type { TableSocket } from "@/core/services/socket";

export interface RequestRollInput {
  socket: TableSocket | null;
  request: IRollRequest;
}

export type RequestRollResult = { ok: true; roll: IRollResult } | { ok: false; error: string };
