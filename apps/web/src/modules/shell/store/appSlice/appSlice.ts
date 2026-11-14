import { createStore } from "zustand/vanilla";

import { createSessionSlice } from "@/modules/auth/store";
import { createLibrarySlice } from "@/modules/library/store";
import { createSheetSlice } from "@/modules/sheet/store";
import { createTableSlice } from "@/modules/table/store";

import type { AppStore } from "./appSlice.types";

/**
 * Creates the app-wide store by combining every feature slice.
 */
export function createAppStore() {
  return createStore<AppStore>()((...args) => ({
    ...createSessionSlice(...args),
    ...createTableSlice(...args),
    ...createSheetSlice(...args),
    ...createLibrarySlice(...args),
  }));
}
