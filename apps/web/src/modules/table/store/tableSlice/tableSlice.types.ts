import type { IPresenceMember, IRollPending, IRollResult } from "@magista/shared";

import type { ConnectionStatus } from "@/modules/table/table.types";

export interface TableState {
  table: {
    connection: ConnectionStatus;
    /** Last measured round trip to the server in ms (null while unknown or offline). */
    latencyMs: number | null;
    members: IPresenceMember[];
    rolls: IRollResult[];
    rollsLoaded: boolean;
    /** Rolls announced but not revealed yet (newest first). */
    pendingRolls: IRollPending[];
  };
}

export interface TableActions {
  setConnection: (connection: ConnectionStatus) => void;
  setLatency: (latencyMs: number | null) => void;
  setMembers: (members: IPresenceMember[]) => void;
  pushRoll: (roll: IRollResult) => void;
  setRolls: (rolls: IRollResult[]) => void;
  addPendingRoll: (pending: IRollPending) => void;
  dropPendingRoll: (rollId: string) => void;
}

export type TableSlice = TableState & TableActions;
