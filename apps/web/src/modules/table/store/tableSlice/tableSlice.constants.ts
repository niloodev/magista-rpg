import type { TableState } from "./tableSlice.types";

export const defaultTableState: TableState = {
  table: { connection: "connecting", members: [], rolls: [], rollsLoaded: false },
};
