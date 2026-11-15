"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { logout } from "@/modules/auth/services";
import { useSkeletonHint, useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp } from "@/modules/shell/store";
import { PRESENCE_HINT_KEY } from "@/modules/table/table.constants";
import { presenceLoadingRows } from "@/modules/table/table.utils";

import { TABLE_LOGOUT_REDIRECT_PATH } from "./TablePage.constants";

/**
 * Exposes identity, live presence, rolls, the profile dialog and the logout action (the character library loads itself).
 * Remembers how many people were online (skeleton hint), and forgets every hint on logout.
 */
export function useTablePage() {
  const router = useRouter();
  const session = useApp((state) => state.session.data);
  const setSession = useApp((state) => state.setSession);
  const connection = useApp((state) => state.table.connection);
  const members = useApp((state) => state.table.members);
  const rolls = useApp((state) => state.table.rolls);
  const rollsLoaded = useApp((state) => state.table.rollsLoaded);
  const [leaving, setLeaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const presenceHint = useSkeletonHint(PRESENCE_HINT_KEY);
  const { setHint, clearHints } = useSkeletonHintActions();

  useEffect(() => {
    if (connection === "connected" && members.length > 0)
      setHint(PRESENCE_HINT_KEY, members.length);
  }, [connection, members.length, setHint]);

  const presenceRows = useMemo(
    () => presenceLoadingRows(connection, members.length, presenceHint),
    [connection, members.length, presenceHint],
  );

  const onLogout = async () => {
    setLeaving(true);
    clearHints();
    await logout({ setSession });
    router.replace(TABLE_LOGOUT_REDIRECT_PATH);
  };

  const isGm = session?.account.role === "GM";

  return {
    displayName: session?.account.login ?? "",
    isGm,
    status: connection,
    members,
    presenceLoadingRows: presenceRows,
    rolls,
    rollsLoading: !rollsLoaded && connection !== "disconnected",
    leaving,
    onLogout,
    profileOpen,
    onOpenProfile: () => setProfileOpen(true),
    onCloseProfile: () => setProfileOpen(false),
  };
}
