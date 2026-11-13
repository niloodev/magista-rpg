"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useApp } from "@/modules/shell/store";

import { LOGIN_PAGE_AUTHENTICATED_PATH } from "./LoginPage.constants";

/**
 * Sends an already authenticated visitor straight to the table.
 */
export function useLoginPage() {
  const router = useRouter();
  const authenticated = useApp(
    (state) => state.session.status === "ready" && state.session.data !== null,
  );

  useEffect(() => {
    if (authenticated) router.replace(LOGIN_PAGE_AUTHENTICATED_PATH);
  }, [authenticated, router]);
}
