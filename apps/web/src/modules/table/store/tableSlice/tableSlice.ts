import type { StateCreator } from "zustand";

import { ROLL_FEED_LIMIT } from "@/modules/table/table.constants";
import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultTableState } from "./tableSlice.constants";
import type { TableSlice } from "./tableSlice.types";

export const createTableSlice: StateCreator<AppStore, [], [], TableSlice> = (set) => ({
  ...defaultTableState,
  setConnection: (connection) => set((state) => ({ table: { ...state.table, connection } })),
  setMembers: (members) => set((state) => ({ table: { ...state.table, members } })),
  pushRoll: (roll) =>
    set((state) => ({
      table: {
        ...state.table,
        rolls: [roll, ...state.table.rolls.filter((current) => current.id !== roll.id)].slice(
          0,
          ROLL_FEED_LIMIT,
        ),
      },
    })),
  setRolls: (rolls) =>
    set((state) => ({
      table: { ...state.table, rolls: rolls.slice(0, ROLL_FEED_LIMIT), rollsLoaded: true },
    })),
});
