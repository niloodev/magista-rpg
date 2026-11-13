"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useApp } from "@/modules/shell/store";

import { SESSION_GATE_REDIRECT_PATH } from "./SessionGate.constants";

/**
 * Redirects anonymous visitors to the login screen once the session has loaded.
 */
export function useSessionGate() {
  const router = useRouter();
  const session = useApp((state) => state.session);
  const authenticated = session.status === "ready" && session.data !== null;
  const anonymous = session.status === "ready" && session.data === null;

  useEffect(() => {
    if (anonymous) router.replace(SESSION_GATE_REDIRECT_PATH);
  }, [anonymous, router]);

  return { authenticated };
}
