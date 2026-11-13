"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import { createAppStore } from "./appSlice";
import type { AppStore } from "./appSlice.types";

type AppStoreApi = ReturnType<typeof createAppStore>;

const AppStoreContext = createContext<AppStoreApi | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createAppStore());
  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

/**
 * Selects a value from the app store. Must be used under AppStoreProvider.
 */
export function useApp<T>(selector: (state: AppStore) => T): T {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("useApp precisa estar dentro de AppStoreProvider");
  return useStore(store, selector);
}
