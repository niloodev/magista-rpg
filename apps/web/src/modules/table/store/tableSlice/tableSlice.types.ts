import type { IPresenceMember, IRollResult } from "@magista/shared";

import type { ConnectionStatus } from "@/modules/table/table.types";

export interface TableState {
  table: {
    connection: ConnectionStatus;
    members: IPresenceMember[];
    rolls: IRollResult[];
    rollsLoaded: boolean;
  };
}

export interface TableActions {
  setConnection: (connection: ConnectionStatus) => void;
  setMembers: (members: IPresenceMember[]) => void;
  pushRoll: (roll: IRollResult) => void;
  setRolls: (rolls: IRollResult[]) => void;
}

export type TableSlice = TableState & TableActions;
