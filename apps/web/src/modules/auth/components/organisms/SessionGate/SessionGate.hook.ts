"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SESSION_HINT_KEY, sessionHint, useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp } from "@/modules/shell/store";

import { SESSION_GATE_REDIRECT_PATH } from "./SessionGate.constants";

/**
 * Redirects anonymous visitors to the login screen once the session has loaded,
 * remembers in the hints cookie the last role and the login *length* (never the login) so the next loading
 * skeleton matches the screen, and forgets every hint when the session is anonymous (shared browsers).
 */
export function useSessionGate() {
  const router = useRouter();
  const session = useApp((state) => state.session);
  const authenticated = session.status === "ready" && session.data !== null;
  const anonymous = session.status === "ready" && session.data === null;
  const role = session.data?.account.role ?? null;
  const login = session.data?.account.login ?? "";
  const { setHint, clearHints } = useSkeletonHintActions();

  useEffect(() => {
    if (anonymous) router.replace(SESSION_GATE_REDIRECT_PATH);
  }, [anonymous, router]);

  useEffect(() => {
    if (role) setHint(SESSION_HINT_KEY, sessionHint(role, login));
    else if (anonymous) clearHints();
  }, [role, login, anonymous, setHint, clearHints]);

  return { authenticated };
}
