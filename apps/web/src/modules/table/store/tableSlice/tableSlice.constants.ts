import type { TableState } from "./tableSlice.types";

export const defaultTableState: TableState = {
  table: {
    connection: "connecting",
    latencyMs: null,
    members: [],
    rolls: [],
    rollsLoaded: false,
    pendingRolls: [],
  },
};
