import type { IPingRequest } from "@magista/shared";

import type { TableSocket } from "@/core/services/socket";

export interface PingEntryInput {
  socket: TableSocket | null;
  request: IPingRequest;
}

export type PingEntryResult = { ok: true } | { ok: false; error: string };
