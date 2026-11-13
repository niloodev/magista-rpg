"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout } from "@/modules/auth/services";
import { useApp } from "@/modules/shell/store";
import { useTablePresence } from "@/modules/table/hooks";

import { TABLE_LOGOUT_REDIRECT_PATH } from "./TablePage.constants";

/**
 * Exposes the logged-in identity, live presence and the logout action for the table page.
 */
export function useTablePage() {
  const router = useRouter();
  const session = useApp((state) => state.session.data);
  const setSession = useApp((state) => state.setSession);
  const { status, members } = useTablePresence();
  const [leaving, setLeaving] = useState(false);

  const onLogout = async () => {
    setLeaving(true);
    await logout({ setSession });
    router.replace(TABLE_LOGOUT_REDIRECT_PATH);
  };

  const displayName = session?.character?.name ?? session?.account.login ?? "";
  const isGm = session?.account.role === "GM";

  return { displayName, isGm, status, members, leaving, onLogout };
}
