"use client";

import {
  canEndTurn,
  type IArenaTurnCommand,
  type IArenaTurnOrder,
  type IArenaTurnPendingEvent,
} from "@magista/shared";
import { useEffect, useMemo, useRef, useState } from "react";

import { toMediaUrl } from "@/core/services/http";
import { ARENA_TURN_TEXTS } from "@/modules/arena/arena.constants";
import type { IArenaTurnMenuActions } from "@/modules/arena/arena.types";
import { tokenDisplayName } from "@/modules/arena/arena.utils";
import { sendArenaTurnCommand } from "@/modules/arena/services";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { useStableCallback } from "@/shared/hooks";

import { TURN_REVEAL_GRACE_MS, TURN_REVEAL_SLACK_MS } from "./useArenaTurns.constants";
import type { UseArenaTurnsProps } from "./useArenaTurns.types";
import {
  createTurnRowsSelector,
  currentTurnToken,
  readTurnsOpen,
  saveTurnsOpen,
} from "./useArenaTurns.utils";

/**
 * The turn order of the scene on screen (the Roll20 "Turn Order"): follows `arena:turns`, sends the GM's commands
 * (pass the turn, edit, sort, clear) and the player's "end my turn", announces whose turn it is and gives the
 * token menu its initiative actions. The order itself lives in the Arena view.
 */
export function useArenaTurns({
  isGm,
  selectedTokens,
  controllableIds,
  onPickToken,
  onAnnounce,
  onError,
}: UseArenaTurnsProps) {
  const socket = useTableSocket();
  const store = useAppStoreApi();
  const view = useApp((state) => state.arena.view);
  const [open, setOpen] = useState(readTurnsOpen);
  const [confirmClear, setConfirmClear] = useState(false);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const { applyArenaTurns, markTurnRolling, expireTurnRolling } = store.getState();
    const onTurns = (order: IArenaTurnOrder) => {
      applyArenaTurns(order);
      expireTurnRolling(Date.now() + TURN_REVEAL_SLACK_MS);
    };
    const onPending = (event: IArenaTurnPendingEvent) => markTurnRolling(event, Date.now());
    socket.on("arena:turns", onTurns);
    socket.on("arena:turn-pending", onPending);
    return () => {
      socket.off("arena:turns", onTurns);
      socket.off("arena:turn-pending", onPending);
    };
  }, [socket, store]);

  const rolling = useApp((state) => state.arena.turnRolling);
  const nextReveal = Object.values(rolling).reduce(
    (soonest, revealAt) => Math.min(soonest, revealAt),
    Number.POSITIVE_INFINITY,
  );

  useEffect(() => {
    if (!Number.isFinite(nextReveal)) return;
    const timer = window.setTimeout(
      () => store.getState().expireTurnRolling(Date.now()),
      Math.max(nextReveal - Date.now(), 0) + TURN_REVEAL_GRACE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [nextReveal, store]);

  const order = useApp((state) => state.arena.turnOrder);
  const sceneId = view?.scene?.id ?? null;
  const round = order?.round ?? 1;

  const selectRows = useMemo(() => createTurnRowsSelector(isGm, toMediaUrl), [isGm]);
  const rows = useApp((state) =>
    selectRows(state.arena.view, state.arena.turnOrder, state.arena.turnRolling),
  );

  const current = currentTurnToken(view, order);
  const currentTokenId = current?.id ?? null;
  const currentName = current ? tokenDisplayName(current, isGm) : null;
  const yourTurn =
    !isGm &&
    current !== null &&
    order !== null &&
    canEndTurn({ role: "PLAYER" }, order, current, view?.controllableCharacterIds ?? []);

  useEffect(() => {
    const key = currentTokenId && sceneId ? `${sceneId}:${round}:${currentTokenId}` : null;
    const previous = announced.current;
    announced.current = key;
    if (!key || previous === null || previous === key || !currentName) return;
    onAnnounce(
      yourTurn
        ? ARENA_TURN_TEXTS.yourTurn(currentName)
        : ARENA_TURN_TEXTS.turnOf(currentName, round),
    );
  }, [sceneId, round, currentTokenId, currentName, yourTurn, onAnnounce]);

  const run = useStableCallback(async (command: IArenaTurnCommand) => {
    const result = await sendArenaTurnCommand(socket, command);
    if (!result.ok) {
      onError(result.error);
      return false;
    }
    onError(null);
    store.getState().applyArenaTurns(result.order);
    return true;
  });

  const toggle = useStableCallback(() => {
    setOpen((value) => {
      saveTurnsOpen(!value);
      return !value;
    });
  });

  const close = useStableCallback(() => {
    setOpen(false);
    saveTurnsOpen(false);
  });

  const onNext = useStableCallback(() => {
    if (sceneId) void run({ action: "next", sceneId });
  });
  const onPrevious = useStableCallback(() => {
    if (sceneId) void run({ action: "previous", sceneId });
  });
  const onEndTurn = useStableCallback(() => {
    if (sceneId && currentTokenId)
      void run({ action: "endTurn", sceneId, tokenId: currentTokenId });
  });
  const onSort = useStableCallback(() => {
    if (sceneId) void run({ action: "sort", sceneId });
  });
  const onConfirmClear = useStableCallback(() => {
    setConfirmClear(false);
    if (sceneId) void run({ action: "clear", sceneId });
  });
  const onSetInitiative = useStableCallback((tokenId: string, initiative: number | null) => {
    if (sceneId) void run({ action: "set", sceneId, tokenId, initiative });
  });
  const onMove = useStableCallback((activeId: string, overId: string) => {
    const index = rows.findIndex((row) => row.id === overId);
    const full = order?.entries.findIndex((entry) => entry.tokenId === rows[index]?.id) ?? -1;
    if (sceneId && full >= 0) void run({ action: "move", sceneId, tokenId: activeId, index: full });
  });
  const onRemove = useStableCallback((tokenId: string) => {
    if (sceneId) void run({ action: "remove", sceneId, tokenIds: [tokenId] });
  });
  const onFocus = useStableCallback((tokenId: string) => {
    if (sceneId) void run({ action: "focus", sceneId, tokenId });
  });

  const menuActions = useMemo<IArenaTurnMenuActions | null>(() => {
    if (!sceneId || selectedTokens.length === 0) return null;
    const tokenIds = selectedTokens.map((token) => token.id);
    const entries = new Map(order?.entries.map((entry) => [entry.tokenId, entry]));
    const canRoll =
      isGm ||
      selectedTokens.every(
        (token) =>
          controllableIds.has(token.id) && (entries.get(token.id)?.initiative ?? null) === null,
      );
    return {
      canRoll,
      canAdd: isGm && tokenIds.some((id) => !entries.has(id)),
      canRemove: isGm && tokenIds.some((id) => entries.has(id)),
      onRoll: () =>
        void run({ action: "roll", sceneId, tokenIds }).then((ok) => {
          if (ok) onAnnounce(ARENA_TURN_TEXTS.rolled(tokenIds.length));
        }),
      onAdd: () => void run({ action: "add", sceneId, tokenIds }),
      onRemove: () => void run({ action: "remove", sceneId, tokenIds }),
    };
  }, [sceneId, selectedTokens, order, isGm, controllableIds, run, onAnnounce]);

  const onRequestClear = useStableCallback(() => setConfirmClear(true));
  const onCancelClear = useStableCallback(() => setConfirmClear(false));

  const handlers = useMemo(
    () => ({
      onNext,
      onPrevious,
      onEndTurn,
      onSort,
      onRequestClear,
      onSetInitiative,
      onMove,
      onRemove,
      onFocus,
      onPick: onPickToken,
      onClose: close,
    }),
    [
      onNext,
      onPrevious,
      onEndTurn,
      onSort,
      onRequestClear,
      onSetInitiative,
      onMove,
      onRemove,
      onFocus,
      onPickToken,
      close,
    ],
  );

  return {
    open,
    toggle,
    rows,
    round,
    started: currentTokenId !== null,
    currentTokenId,
    currentName,
    yourTurn,
    menuActions,
    handlers,
    confirmClear,
    onCancelClear,
    onConfirmClear,
  };
}
