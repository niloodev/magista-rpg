"use client";

import {
  clampToMap,
  isErrorResult,
  type IArenaBounds,
  type IArenaDragEvent,
  type IArenaPoint,
} from "@magista/shared";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toMediaUrl } from "@/core/services/http";
import {
  ARENA_DRAG_EMIT_MS,
  ARENA_EMPTY_BOUNDS,
  ARENA_EMPTY_TEXTS,
  ARENA_HINT_KEY,
  ARENA_MOVED_LABEL,
  ARENA_STAGE_LABEL,
  ARENA_MY_TRAY_LABEL,
  ARENA_NUDGE_COMMIT_MS,
  ARENA_NUDGE_STEP,
  ARENA_NUDGE_STEP_LARGE,
  ARENA_PREVIEW_STALE_MS,
  ARENA_TRAY_LABEL,
} from "@/modules/arena/arena.constants";
import type { IArenaStageControls, IPendingNudge } from "@/modules/arena/arena.types";
import { arenaHint, arrowDelta, roundPoint, toRenderTokens } from "@/modules/arena/arena.utils";
import { emitArenaDrag, fetchArena, moveArenaToken } from "@/modules/arena/services";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

/**
 * Drives the Arena: loads what this account may see, follows the live events (tokens created, changed, removed,
 * dragged by others, scene switched) and turns board gestures and keys into moves. Moves show at once and are
 * confirmed by the server; a refused move reloads the scene and shows why.
 */
export function useArenaPage() {
  const socket = useTableSocket();
  const store = useAppStoreApi();
  const isGm = useApp((state) => state.session.data?.account.role === "GM");
  const connection = useApp((state) => state.table.connection);
  const memberCount = useApp((state) => state.table.members.length);
  const { status, view, error, selectedTokenId, previews } = useApp((state) => state.arena);
  const controlsRef = useRef<IArenaStageControls | null>(null);
  const boundsRef = useRef<IArenaBounds>(ARENA_EMPTY_BOUNDS);
  const lastDragEmit = useRef(0);
  const nudgeTimer = useRef(0);
  const pendingNudge = useRef<IPendingNudge | null>(null);
  const previewTimers = useRef(new Map<string, number>());
  const lostConnection = useRef(false);
  const loadSeq = useRef(0);
  const mounted = useRef(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const { setHint } = useSkeletonHintActions();

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    store.getState().startArenaLoad();
    const result = await fetchArena();
    if (!mounted.current || seq !== loadSeq.current) return;
    if (isErrorResult(result)) store.getState().failArenaLoad(result.error);
    else store.getState().finishArenaLoad(result.payload);
  }, [store]);

  useEffect(() => {
    mounted.current = true;
    void load();
    const timers = previewTimers.current;
    return () => {
      mounted.current = false;
      window.clearTimeout(nudgeTimer.current);
      const pending = pendingNudge.current;
      pendingNudge.current = null;
      if (pending)
        void moveArenaToken(socket, { tokenId: pending.tokenId, ...roundPoint(pending.point) });
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
      store.getState().resetArena();
    };
  }, [load, store, socket]);

  useEffect(() => {
    if (connection === "disconnected") lostConnection.current = true;
    if (connection !== "connected" || !lostConnection.current) return;
    lostConnection.current = false;
    void load();
  }, [connection, load]);

  useEffect(() => {
    if (!socket) return;
    const { applyArenaToken, removeArenaToken, applyArenaDrag, clearArenaDrag } = store.getState();
    const timers = previewTimers.current;
    const onScene = () => void load();
    const onDragging = (event: IArenaDragEvent) => {
      applyArenaDrag(event);
      window.clearTimeout(timers.get(event.tokenId));
      timers.set(
        event.tokenId,
        window.setTimeout(() => clearArenaDrag(event.tokenId), ARENA_PREVIEW_STALE_MS),
      );
    };
    socket.on("arena:scene", onScene);
    socket.on("arena:token", applyArenaToken);
    socket.on("arena:token-removed", removeArenaToken);
    socket.on("arena:dragging", onDragging);
    return () => {
      socket.off("arena:scene", onScene);
      socket.off("arena:token", applyArenaToken);
      socket.off("arena:token-removed", removeArenaToken);
      socket.off("arena:dragging", onDragging);
    };
  }, [socket, store, load]);

  const renderTokens = useMemo(
    () => (view ? toRenderTokens(view, previews, isGm, toMediaUrl) : []),
    [view, previews, isGm],
  );

  const trayTokens = useMemo(
    () =>
      renderTokens
        .filter((token) => token.controllable)
        .map(({ id, name, imageUrl, tone, hidden }) => ({ id, name, imageUrl, tone, hidden })),
    [renderTokens],
  );

  const sceneName = view?.scene?.name ?? null;
  const trayCount = trayTokens.length;

  useEffect(() => {
    if (status === "ready") setHint(ARENA_HINT_KEY, arenaHint(trayCount, sceneName));
  }, [status, trayCount, sceneName, setHint]);

  const commitMove = useCallback(
    async (tokenId: string, point: IArenaPoint) => {
      if (pendingNudge.current?.tokenId === tokenId) {
        window.clearTimeout(nudgeTimer.current);
        pendingNudge.current = null;
      }
      const rounded = roundPoint(point);
      store.getState().placeArenaToken(tokenId, rounded);
      const result = await moveArenaToken(socket, { tokenId, ...rounded });
      if (!result.ok) {
        setActionError(result.error);
        void load();
        return;
      }
      setActionError(null);
      setAnnouncement(ARENA_MOVED_LABEL(result.token.name));
    },
    [socket, store, load],
  );

  const onSelect = useCallback(
    (tokenId: string | null) => store.getState().selectArenaToken(tokenId),
    [store],
  );

  const onDragMove = useCallback(
    (tokenId: string, point: IArenaPoint) => {
      const now = Date.now();
      if (now - lastDragEmit.current < ARENA_DRAG_EMIT_MS) return;
      lastDragEmit.current = now;
      emitArenaDrag(socket, { tokenId, x: point.x, y: point.y });
    },
    [socket],
  );

  const onBounds = useCallback((bounds: IArenaBounds) => {
    boundsRef.current = bounds;
  }, []);

  const onPickToken = (tokenId: string) => {
    store.getState().selectArenaToken(tokenId);
    controlsRef.current?.centerOn(tokenId);
  };

  const nudgeSelected = (delta: IArenaPoint, large: boolean) => {
    const selected = renderTokens.find((token) => token.id === selectedTokenId);
    if (!selected?.controllable) return false;
    const step = large ? ARENA_NUDGE_STEP_LARGE : ARENA_NUDGE_STEP;
    const point = clampToMap(
      { x: selected.x + delta.x * step, y: selected.y + delta.y * step },
      boundsRef.current,
    );
    const previous = pendingNudge.current;
    if (previous && previous.tokenId !== selected.id)
      void commitMove(previous.tokenId, previous.point);
    store.getState().placeArenaToken(selected.id, point);
    pendingNudge.current = { tokenId: selected.id, point };
    window.clearTimeout(nudgeTimer.current);
    nudgeTimer.current = window.setTimeout(
      () => void commitMove(selected.id, point),
      ARENA_NUDGE_COMMIT_MS,
    );
    return true;
  };

  const onStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = arrowDelta(event.key);
    if (delta) {
      if (nudgeSelected(delta, event.shiftKey)) event.preventDefault();
      return;
    }
    const actions: Record<string, (() => void) | undefined> = {
      "+": controlsRef.current?.zoomIn,
      "=": controlsRef.current?.zoomIn,
      "-": controlsRef.current?.zoomOut,
      "0": controlsRef.current?.fit,
      Escape: () => store.getState().selectArenaToken(null),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const scene = view?.scene ?? null;
  const stageScene = useMemo(
    () => (scene ? { id: scene.id, mapUrl: toMediaUrl(scene.mapUrl) } : null),
    [scene],
  );

  return {
    isGm,
    status,
    loadError: error,
    scene,
    stageScene,
    stageLabel: scene ? ARENA_STAGE_LABEL(scene.name, renderTokens.length) : "",
    empty: isGm ? ARENA_EMPTY_TEXTS.gm : ARENA_EMPTY_TEXTS.player,
    notice: actionError ?? (status === "ready" ? error : null),
    mapFailed,
    onMapError: setMapFailed,
    onRetryMap: () => controlsRef.current?.retryMap(),
    renderTokens,
    trayTokens,
    trayLabel: isGm ? ARENA_TRAY_LABEL : ARENA_MY_TRAY_LABEL,
    selectedTokenId,
    connection,
    memberCount,
    controlsRef,
    announcement,
    profileOpen,
    onOpenProfile: () => setProfileOpen(true),
    onCloseProfile: () => setProfileOpen(false),
    onRetry: () => void load(),
    onSelect,
    onDragMove,
    onDrop: (tokenId: string, point: IArenaPoint) => void commitMove(tokenId, point),
    onBounds,
    onPickToken,
    onStageKeyDown,
    onZoomIn: () => controlsRef.current?.zoomIn(),
    onZoomOut: () => controlsRef.current?.zoomOut(),
    onFit: () => controlsRef.current?.fit(),
  };
}
