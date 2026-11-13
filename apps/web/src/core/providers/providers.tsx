"use client";

import type { ReactNode } from "react";

import { SessionProvider } from "@/modules/auth/providers";
import { AppStoreProvider } from "@/modules/shell/store";

export function GlobalProviders({ children }: { children: ReactNode }) {
  return (
    <AppStoreProvider>
      <SessionProvider>{children}</SessionProvider>
    </AppStoreProvider>
  );
}
