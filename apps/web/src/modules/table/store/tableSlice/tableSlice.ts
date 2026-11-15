import type { StateCreator } from "zustand";

import { PENDING_ROLLS_LIMIT, ROLL_FEED_LIMIT } from "@/modules/table/table.constants";
import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultTableState } from "./tableSlice.constants";
import { sameMembers } from "./tableSlice.utils";
import type { TableSlice } from "./tableSlice.types";

export const createTableSlice: StateCreator<AppStore, [], [], TableSlice> = (set) => ({
  ...defaultTableState,
  setConnection: (connection) =>
    set((state) => ({
      table: {
        ...state.table,
        connection,
        latencyMs: connection === "connected" ? state.table.latencyMs : null,
      },
    })),
  setLatency: (latencyMs) =>
    set((state) =>
      state.table.latencyMs === latencyMs ? state : { table: { ...state.table, latencyMs } },
    ),
  setMembers: (members) =>
    set((state) =>
      sameMembers(state.table.members, members) ? state : { table: { ...state.table, members } },
    ),
  pushRoll: (roll) =>
    set((state) => ({
      table: {
        ...state.table,
        rolls: [roll, ...state.table.rolls.filter((current) => current.id !== roll.id)].slice(
          0,
          ROLL_FEED_LIMIT,
        ),
        pendingRolls: state.table.pendingRolls.filter((pending) => pending.id !== roll.id),
      },
    })),
  addPendingRoll: (pending) =>
    set((state) =>
      state.table.rolls.some((roll) => roll.id === pending.id)
        ? state
        : {
            table: {
              ...state.table,
              pendingRolls: [
                pending,
                ...state.table.pendingRolls.filter((current) => current.id !== pending.id),
              ].slice(0, PENDING_ROLLS_LIMIT),
            },
          },
    ),
  dropPendingRoll: (rollId) =>
    set((state) => ({
      table: {
        ...state.table,
        pendingRolls: state.table.pendingRolls.filter((pending) => pending.id !== rollId),
      },
    })),
  setRolls: (rolls) =>
    set((state) => ({
      table: {
        ...state.table,
        rolls: rolls.slice(0, ROLL_FEED_LIMIT),
        rollsLoaded: true,
        pendingRolls: state.table.pendingRolls.filter(
          (pending) => !rolls.some((roll) => roll.id === pending.id),
        ),
      },
    })),
});
