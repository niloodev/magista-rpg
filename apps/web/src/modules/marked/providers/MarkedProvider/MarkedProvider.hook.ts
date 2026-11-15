"use client";

import { isErrorResult } from "@magista/shared";
import { useEffect } from "react";

import { MARKED_STALE_GRACE_MS } from "@/modules/marked/marked.constants";
import { fetchOwnCharacterIds } from "@/modules/marked/services";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

/**
 * Mirrors the Marca events into the store (proposals, outcomes, the active share). For players it loads the
 * characters of the account on mount and again on every new proposal, so the modal knows which sheets it answers for even after
 * the GM changed the access. A proposal whose outcome never arrives (dropped connection) expires locally
 * shortly after its deadline instead of blocking new shares.
 */
export function useMarkedProvider() {
  const socket = useTableSocket();
  const store = useAppStoreApi();
  const proposalId = useApp((state) => state.marked.proposal?.id ?? null);
  const expiresAt = useApp((state) => state.marked.proposal?.expiresAt ?? null);
  const isPlayer = useApp((state) => state.session.data?.account.role === "PLAYER");

  useEffect(() => {
    if (!socket) return;
    const { setMarkedShare, applyMarkedProposal, applyMarkedResolution } = store.getState();
    socket.on("marked:share", setMarkedShare);
    socket.on("marked:proposal", applyMarkedProposal);
    socket.on("marked:resolved", applyMarkedResolution);
    return () => {
      socket.off("marked:share", setMarkedShare);
      socket.off("marked:proposal", applyMarkedProposal);
      socket.off("marked:resolved", applyMarkedResolution);
    };
  }, [socket, store]);

  useEffect(() => {
    if (!isPlayer) return;
    let active = true;
    void fetchOwnCharacterIds().then((result) => {
      if (active && !isErrorResult(result)) store.getState().setMarkedOwnIds(result.payload);
    });
    return () => {
      active = false;
    };
  }, [proposalId, isPlayer, store]);

  useEffect(() => {
    if (!proposalId || !expiresAt) return;
    const delay = Math.max(0, new Date(expiresAt).getTime() - Date.now()) + MARKED_STALE_GRACE_MS;
    const timer = window.setTimeout(() => {
      if (store.getState().marked.proposal?.id !== proposalId) return;
      store.getState().applyMarkedResolution({ proposalId, outcome: "expired", decidedBy: null });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [proposalId, expiresAt, store]);
}
