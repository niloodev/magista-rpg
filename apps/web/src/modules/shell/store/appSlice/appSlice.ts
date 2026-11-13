import { createStore } from "zustand/vanilla";

import { createSessionSlice } from "@/modules/auth/store";

import type { AppStore } from "./appSlice.types";

/**
 * Creates the app-wide store by combining every feature slice.
 */
export function createAppStore() {
  return createStore<AppStore>()((...args) => ({
    ...createSessionSlice(...args),
  }));
}
