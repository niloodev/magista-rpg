import type { StateCreator } from "zustand";

import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultSessionState } from "./sessionSlice.constants";
import type { SessionSlice } from "./sessionSlice.types";

export const createSessionSlice: StateCreator<AppStore, [], [], SessionSlice> = (set) => ({
  ...defaultSessionState,
  setSession: (data) => set({ session: { status: "ready", data } }),
  setSessionStatus: (status) => set((state) => ({ session: { ...state.session, status } })),
});
