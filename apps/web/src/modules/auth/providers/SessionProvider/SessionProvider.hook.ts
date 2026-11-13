"use client";

import { useEffect } from "react";

import { fetchSession } from "@/modules/auth/services";
import { useApp } from "@/modules/shell/store";

/**
 * Loads the session once when the app mounts.
 */
export function useSessionProvider() {
  const setSession = useApp((state) => state.setSession);
  const setSessionStatus = useApp((state) => state.setSessionStatus);

  useEffect(() => {
    void fetchSession({ setSession, setSessionStatus });
  }, [setSession, setSessionStatus]);
}
