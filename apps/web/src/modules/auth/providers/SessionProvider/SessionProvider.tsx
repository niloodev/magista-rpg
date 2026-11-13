"use client";

import { useSessionProvider } from "./SessionProvider.hook";
import type { SessionProviderProps } from "./SessionProvider.types";

export function SessionProvider({ children }: SessionProviderProps) {
  useSessionProvider();
  return <>{children}</>;
}
