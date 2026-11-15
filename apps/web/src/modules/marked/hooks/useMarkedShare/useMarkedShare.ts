"use client";

import { useState } from "react";

import { stopMarkedShare } from "@/modules/marked/services";
import { useApp } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

/**
 * Active Marca share as seen from one sheet, plus the confirmed "stop" action (its source or the GM).
 */
export function useMarkedShare(characterId: string) {
  const socket = useTableSocket();
  const share = useApp((state) => state.marked.share);
  const isGm = useApp((state) => state.session.data?.account.role === "GM");
  const [confirming, setConfirming] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const isSource = share?.source.characterId === characterId;
  const canStop = Boolean(share) && (isSource || isGm);

  const confirmStop = async () => {
    if (!share) return;
    setStopping(true);
    const result = await stopMarkedShare(socket, share.id);
    setStopping(false);
    setConfirming(false);
    setStopError(result.ok ? null : result.error);
  };

  return {
    share,
    isGm,
    isSource,
    canStop,
    stopping,
    stopError,
    confirming,
    requestStop: () => setConfirming(true),
    cancelStop: () => setConfirming(false),
    confirmStop: () => void confirmStop(),
  };
}
