"use client";

import { useId } from "react";

import { writePerfMode } from "@/core/services/performance";
import { ROLE_LABELS } from "@/modules/profile/profile.constants";
import { useApp } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { usePrefersReducedMotion } from "@/shared/hooks";

/**
 * Profile data (login and role), the device performance mode and what to do after a password change: the server
 * dropped this account's sockets, so this tab reconnects with the renewed cookie.
 */
export function useProfileDialog() {
  const sectionId = useId();
  const account = useApp((state) => state.session.data?.account ?? null);
  const socket = useTableSocket();
  const performanceMode = usePrefersReducedMotion();

  return {
    sectionId,
    login: account?.login ?? "",
    roleLabel: account ? ROLE_LABELS[account.role] : "",
    performanceMode,
    onPerformanceChange: (enabled: boolean) => writePerfMode(enabled ? "low" : "full"),
    onPasswordChanged: () => {
      socket?.disconnect().connect();
    },
  };
}
