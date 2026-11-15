"use client";

import {
  ARENA_SCENE_NOT_FOUND_MESSAGE,
  ARENA_TOKEN_SIZE_DEFAULT,
  clampToMap,
  isErrorResult,
  type IArenaBounds,
  type IArenaDragEvent,
  ARENA_TOKEN_SIZE_MAX,
  ARENA_TOKEN_SIZE_MIN,
  type IArenaPoint,
  type IArenaSceneEvent,
  type IArenaTokenPatch,
  type IMoveArenaTokenInput,
} from "@magista/shared";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { toMediaUrl } from "@/core/services/http";
import {
  ARENA_DRAG_EMIT_MS,
  ARENA_EMPTY_BOUNDS,
  ARENA_EMPTY_TEXTS,
  ARENA_HINT_DELAY_MS,
  ARENA_HINT_KEY,
  ARENA_MOVED_LABEL,
  ARENA_STAGE_LABEL,
  ARENA_MY_TRAY_LABEL,
  ARENA_NUDGE_COMMIT_MS,
  ARENA_NUDGE_STEP,
  ARENA_NUDGE_STEP_LARGE,
  ARENA_PREVIEW_STALE_MS,
  ARENA_PREVIEW_TEXTS,
  ARENA_SELECTION_TEXTS,
  ARENA_SIZE_COMMIT_MS,
  ARENA_SELECTION_BAR_SLOT,
} from "@/modules/arena/arena.constants";
import type {
  ArenaDockSide,
  ArenaSelectionMode,
  ArenaSidebarTab,
  IArenaSidebarState,
  IArenaSizeUpdate,
  IArenaStageControls,
} from "@/modules/arena/arena.types";
import {
  arenaHint,
  arrowDelta,
  roundPoint,
  selectionSummary,
  readSidebarState,
  saveSidebarState,
  toRenderTokens,
  dockSideOf,
  fitPanels,
  sheetNameOf,
} from "@/modules/arena/arena.utils";
import {
  deleteArenaTokens,
  emitArenaDrag,
  fetchArena,
  moveArenaTokens,
  setArenaLiveScene,
  updateArenaTokens,
} from "@/modules/arena/services";
import { useArenaTokenPlacement } from "@/modules/arena/hooks";
import { sheetNames } from "@/modules/sheet/store";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { useIsDesktopViewport, useViewportWidth } from "@/shared/hooks";

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
  const latencyMs = useApp((state) => state.table.latencyMs);
  const memberCount = useApp((state) => state.table.members.length);
  const { status, view, error, selectedTokenIds, previews, viewSceneId, docked, dockTab } = useApp(
    (state) => state.arena,
  );
  const namesById = useApp(useShallow((state) => sheetNames(state.sheets)));
  const libraryCharacters = useApp((state) => state.library.characters);
  const rolls = useApp((state) => state.table.rolls);
  const pendingRolls = useApp((state) => state.table.pendingRolls);
  const rollsLoaded = useApp((state) => state.table.rollsLoaded);
  const [sidebar, setSidebar] = useState<IArenaSidebarState>(readSidebarState);
  const desktop = useIsDesktopViewport();
  const viewportWidth = useViewportWidth();
  const controlsRef = useRef<IArenaStageControls | null>(null);
  const boundsRef = useRef<IArenaBounds>(ARENA_EMPTY_BOUNDS);
  const lastDragEmit = useRef(0);
  const nudgeTimer = useRef(0);
  const pendingNudge = useRef(new Map<string, IArenaPoint>());
  const previewTimers = useRef(new Map<string, number>());
  const lostConnection = useRef(false);
  const loadSeq = useRef(0);
  const mounted = useRef(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const sizeTimer = useRef(0);
  const pendingSize = useRef<IArenaTokenPatch[] | null>(null);
  const { setHint } = useSkeletonHintActions();
  const reportPreviewGone = useRef(() => {});

  useEffect(() => {
    reportPreviewGone.current = () => setActionError(ARENA_PREVIEW_TEXTS.gone);
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const previewing = store.getState().arena.viewSceneId;
    store.getState().startArenaLoad();
    const result = await fetchArena(previewing ?? undefined);
    if (!mounted.current || seq !== loadSeq.current) return;
    if (isErrorResult(result)) {
      if (previewing && result.error === ARENA_SCENE_NOT_FOUND_MESSAGE) {
        reportPreviewGone.current();
        store.getState().setArenaViewScene(null);
        return;
      }
      store.getState().failArenaLoad(result.error);
    } else store.getState().finishArenaLoad(result.payload);
  }, [store]);

  const updateSidebar = (patch: Partial<IArenaSidebarState>, persist = true) => {
    const next = { ...sidebar, ...patch };
    setSidebar(next);
    if (persist) saveSidebarState(next);
  };

  useEffect(() => {
    if (!desktop) return;
    mounted.current = true;
    void load();
    const timers = previewTimers.current;
    const nudges = pendingNudge.current;
    return () => {
      mounted.current = false;
      window.clearTimeout(nudgeTimer.current);
      window.clearTimeout(sizeTimer.current);
      const sizes = pendingSize.current;
      pendingSize.current = null;
      if (sizes) void updateArenaTokens(sizes);
      const pending = [...nudges].map(([tokenId, point]) => ({
        tokenId,
        ...roundPoint(point),
      }));
      nudges.clear();
      if (pending.length > 0) void moveArenaTokens(socket, { moves: pending });
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
      store.getState().resetArena();
    };
  }, [load, store, socket, desktop]);

  const shownViewScene = useRef(viewSceneId);

  useEffect(() => {
    if (shownViewScene.current === viewSceneId) return;
    shownViewScene.current = viewSceneId;
    if (mounted.current) void load();
  }, [viewSceneId, load]);

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
    const onScene = (event: IArenaSceneEvent) => {
      if (!event.libraryOnly) void load();
    };
    const onDragging = (event: IArenaDragEvent) => {
      applyArenaDrag(event);
      for (const { tokenId } of event.moves) {
        window.clearTimeout(timers.get(tokenId));
        timers.set(
          tokenId,
          window.setTimeout(() => clearArenaDrag(tokenId), ARENA_PREVIEW_STALE_MS),
        );
      }
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
        .filter((token) => !isGm && token.controllable)
        .map(({ id, name, imageUrl, tone, hidden }) => ({ id, name, imageUrl, tone, hidden })),
    [renderTokens, isGm],
  );

  const sceneName = view?.scene?.name ?? null;
  const trayCount = trayTokens.length;

  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setTimeout(
      () => setHint(ARENA_HINT_KEY, arenaHint(trayCount, sceneName, sidebar)),
      ARENA_HINT_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [status, trayCount, sceneName, sidebar, setHint]);

  const commitMoves = useCallback(
    async (moves: IMoveArenaTokenInput[]) => {
      if (moves.length === 0) return;
      const rounded = moves.map((move) => ({ ...move, ...roundPoint(move) }));
      for (const { tokenId } of rounded) pendingNudge.current.delete(tokenId);
      if (pendingNudge.current.size === 0) window.clearTimeout(nudgeTimer.current);
      store.getState().placeArenaTokens(rounded);
      const result = await moveArenaTokens(socket, { moves: rounded });
      if (!result.ok) {
        setActionError(result.error);
        void load();
        return;
      }
      setActionError(null);
      if (result.refused.length > 0) void load();
      const [first] = result.tokens;
      if (first) setAnnouncement(ARENA_MOVED_LABEL(first.name, result.tokens.length));
    },
    [socket, store, load],
  );

  const onSelect = useCallback(
    (tokenIds: string[], mode: ArenaSelectionMode) =>
      store.getState().selectArenaTokens(tokenIds, mode),
    [store],
  );

  const onDragMove = useCallback(
    (moves: IMoveArenaTokenInput[]) => {
      const now = Date.now();
      if (now - lastDragEmit.current < ARENA_DRAG_EMIT_MS) return;
      lastDragEmit.current = now;
      emitArenaDrag(socket, { moves });
    },
    [socket],
  );

  const onBounds = useCallback((bounds: IArenaBounds) => {
    boundsRef.current = bounds;
  }, []);

  const selectedTokens = useMemo(() => {
    const ids = new Set(selectedTokenIds);
    return view?.tokens.filter((token) => ids.has(token.id)) ?? [];
  }, [view, selectedTokenIds]);

  const flushSize = useCallback(() => {
    window.clearTimeout(sizeTimer.current);
    const sizes = pendingSize.current;
    pendingSize.current = null;
    return sizes;
  }, []);

  const saveTokens = useCallback(
    async (patches: IArenaTokenPatch[]) => {
      const sizes = flushSize();
      const byId = new Map((sizes ?? []).map((patch) => [patch.id, patch]));
      for (const patch of patches) byId.set(patch.id, { ...byId.get(patch.id), ...patch });
      const merged = [...byId.values()];
      store.getState().patchArenaTokens(merged);
      const result = await updateArenaTokens(merged);
      if (isErrorResult(result)) {
        setActionError(result.error);
        void load();
      }
    },
    [store, load, flushSize],
  );

  const onResize = useCallback(
    (updates: IArenaSizeUpdate[]) => void saveTokens(updates),
    [saveTokens],
  );

  const onSizeChange = (size: number | null) => {
    if (size === null || selectedTokens.length === 0) return;
    const clamped = Math.min(Math.max(size, ARENA_TOKEN_SIZE_MIN), ARENA_TOKEN_SIZE_MAX);
    const patches = selectedTokens.map((token) => ({ id: token.id, size: clamped }));
    store.getState().patchArenaTokens(patches);
    pendingSize.current = patches;
    window.clearTimeout(sizeTimer.current);
    sizeTimer.current = window.setTimeout(() => {
      const sizes = flushSize();
      if (sizes) void saveTokens(sizes);
    }, ARENA_SIZE_COMMIT_MS);
  };

  const summary = selectionSummary(selectedTokens, isGm, view?.controllableCharacterIds ?? []);
  const { allHidden, sheetTarget } = summary;

  const onToggleHidden = () =>
    void saveTokens(selectedTokens.map((token) => ({ id: token.id, hidden: !allHidden })));

  const onConfirmRemove = async () => {
    setConfirmRemove(false);
    flushSize();
    const ids = selectedTokens.map((token) => token.id);
    if (ids.length === 0) return;
    const result = await deleteArenaTokens(ids);
    if (isErrorResult(result)) {
      setActionError(result.error);
      void load();
      return;
    }
    store.getState().selectArenaTokens([], "replace");
  };

  const onPickToken = (tokenId: string) => {
    store.getState().selectArenaTokens([tokenId], "replace");
    controlsRef.current?.centerOn(tokenId);
  };

  const nudgeSelected = (delta: IArenaPoint, large: boolean) => {
    const selected = new Set(selectedTokenIds);
    const movable = renderTokens.filter((token) => selected.has(token.id) && token.controllable);
    if (movable.length === 0) return false;
    const step = large ? ARENA_NUDGE_STEP_LARGE : ARENA_NUDGE_STEP;
    const moves = movable.map((token) => ({
      tokenId: token.id,
      ...clampToMap(
        { x: token.x + delta.x * step, y: token.y + delta.y * step },
        boundsRef.current,
      ),
    }));
    store.getState().placeArenaTokens(moves);
    for (const { tokenId, x, y } of moves) pendingNudge.current.set(tokenId, { x, y });
    window.clearTimeout(nudgeTimer.current);
    nudgeTimer.current = window.setTimeout(() => {
      const pending = [...pendingNudge.current].map(([tokenId, point]) => ({ tokenId, ...point }));
      void commitMoves(pending);
    }, ARENA_NUDGE_COMMIT_MS);
    return true;
  };

  const onStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = arrowDelta(event.key);
    if (delta) {
      if (nudgeSelected(delta, event.shiftKey)) event.preventDefault();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      store.getState().selectArenaTokens(
        renderTokens.map((token) => token.id),
        "replace",
      );
      return;
    }
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      isGm &&
      selectedTokens.length > 0
    ) {
      event.preventDefault();
      setConfirmRemove(true);
      return;
    }
    const actions: Record<string, (() => void) | undefined> = {
      "+": controlsRef.current?.zoomIn,
      "=": controlsRef.current?.zoomIn,
      "-": controlsRef.current?.zoomOut,
      "0": controlsRef.current?.fit,
      Escape: () => store.getState().selectArenaTokens([], "replace"),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const liveSceneId = view?.activeSceneId ?? null;
  const viewingSceneId = view?.scene?.id ?? null;

  const onPreviewScene = (sceneId: string) =>
    store.getState().setArenaViewScene(sceneId === liveSceneId ? null : sceneId);

  const onGoLive = async (sceneId: string) => {
    const result = await setArenaLiveScene(sceneId);
    if (isErrorResult(result)) {
      setActionError(result.error);
      return;
    }
    setActionError(null);
    store.getState().setArenaViewScene(null);
    setAnnouncement(ARENA_PREVIEW_TEXTS.wentLive);
  };

  const broadcast =
    isGm && view?.scene
      ? { live: view.scene.id === view.activeSceneId, hasLive: view.activeSceneId !== null }
      : null;

  const { left: insetLeft, right: insetRight } = fitPanels(
    sidebar.rollsOpen ? sidebar.rollsWidth : 0,
    sidebar.open ? sidebar.width : 0,
    viewportWidth,
  );

  const isOverMap = useCallback(
    (point: { x: number; y: number }) =>
      controlsRef.current?.clientToWorld(point.x, point.y) != null,
    [],
  );

  const tokenPreviewSize = useCallback(
    () => ARENA_TOKEN_SIZE_DEFAULT * (controlsRef.current?.zoom() ?? 1),
    [],
  );

  const onDock = (characterId: string, side: ArenaDockSide) => {
    store.getState().dockArenaSheet(characterId, side);
    updateSidebar(side === "left" ? { rollsOpen: true } : { open: true });
  };

  const openSheet = (characterId: string) => {
    const side = dockSideOf(docked, characterId);
    if (!side) {
      store.getState().openArenaSheet(characterId);
      return;
    }
    store.getState().showDockTab(side, characterId);
    updateSidebar(side === "left" ? { rollsOpen: true } : { open: true });
  };

  const dockedTabs = (side: ArenaDockSide) => ({
    sheets: docked[side].map((id) => ({
      id,
      name: sheetNameOf(id, namesById, libraryCharacters),
    })),
    active: dockTab[side],
    onShow: (characterId: string | null) => store.getState().showDockTab(side, characterId),
  });

  const scene = view?.scene ?? null;
  const placement = useArenaTokenPlacement({
    sceneId: scene?.id ?? null,
    enabled: isGm && status === "ready",
    controlsRef,
    boundsRef,
    onError: setActionError,
  });
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
    trayLabel: ARENA_MY_TRAY_LABEL,
    selectedTokenIds,
    selectedTokenId: selectedTokenIds.length === 1 ? (selectedTokenIds[0] ?? null) : null,
    desktop,
    connection,
    latencyMs,
    memberCount,
    controlsRef,
    announcement,
    profileOpen,
    onOpenProfile: () => setProfileOpen(true),
    onCloseProfile: () => setProfileOpen(false),
    onRetry: () => void load(),
    onSelect,
    onDragMove,
    onDrop: (moves: IMoveArenaTokenInput[]) => void commitMoves(moves),
    onResize,
    selection:
      selectedTokens.length > 0
        ? {
            label: ARENA_SELECTION_TEXTS.count(selectedTokens.length),
            size: summary.size,
            allHidden,
            canOpenSheet: sheetTarget !== null,
          }
        : null,
    onSizeChange,
    onToggleHidden,
    onOpenSheet: () => {
      if (sheetTarget) openSheet(sheetTarget);
    },
    onRequestRemove: () => setConfirmRemove(true),
    confirmRemove,
    confirmRemoveTitle: ARENA_SELECTION_TEXTS.confirmTitle(selectedTokens.length),
    onConfirmRemove: () => void onConfirmRemove(),
    onCancelRemove: () => setConfirmRemove(false),
    onBounds,
    onPickToken,
    onStageKeyDown,
    stageInsetRight: insetRight,
    stageInsetLeft: insetLeft,
    hudStyle: { left: insetLeft, right: insetRight },
    sidebarWidth: insetRight || sidebar.width,
    rollsWidth: insetLeft || sidebar.rollsWidth,
    onSidebarResize: (width: number) => updateSidebar({ width }, false),
    onSidebarResizeCommit: (width: number) => updateSidebar({ width }),
    onRollsResize: (rollsWidth: number) => updateSidebar({ rollsWidth }, false),
    onRollsResizeCommit: (rollsWidth: number) => updateSidebar({ rollsWidth }),
    rollsOpen: sidebar.rollsOpen,
    onRollsOpen: (rollsOpen: boolean) => updateSidebar({ rollsOpen }),
    broadcast,
    onGoLiveViewed: () => {
      if (viewingSceneId) void onGoLive(viewingSceneId);
    },
    onBackToLive: () => store.getState().setArenaViewScene(null),
    sidebarOpen: sidebar.open,
    sidebarTab: !isGm && sidebar.tab === "scenes" ? "characters" : sidebar.tab,
    onSidebarTab: (tab: ArenaSidebarTab) => updateSidebar({ tab }),
    onSidebarOpen: (open: boolean) => updateSidebar({ open }),
    onOpenCharacter: openSheet,
    dockedLeft: dockedTabs("left"),
    dockedRight: dockedTabs("right"),
    windowPanels: { left: insetLeft, right: insetRight },
    onDock,
    onUndock: (characterId: string) => store.getState().undockArenaSheet(characterId),
    sheetNameFor: (characterId: string) => sheetNameOf(characterId, namesById, libraryCharacters),
    onCloseDocked: (characterId: string) => store.getState().closeDockedSheet(characterId),
    canPlace: Boolean(scene) && status === "ready",
    isOverMap,
    tokenPreviewSize,
    onPlaceCharacter: placement.placeCharacter,
    onDropCharacter: placement.dropCharacter,
    npcDialogOpen: placement.npcDialogOpen,
    onNewNpc: placement.openNpcDialog,
    onCloseNpc: placement.closeNpcDialog,
    selectionSlotClassName: `${ARENA_SELECTION_BAR_SLOT.base} ${
      trayTokens.length > 0
        ? ARENA_SELECTION_BAR_SLOT.bottom.aboveTray
        : ARENA_SELECTION_BAR_SLOT.bottom.free
    }`,
    onSubmitNpc: placement.submitNpc,
    liveSceneId,
    viewingSceneId,
    onPreviewScene,
    onGoLive: (sceneId: string) => void onGoLive(sceneId),
    rolls,
    pendingRolls,
    rollsLoading: !rollsLoaded && connection !== "disconnected",
    onZoomIn: () => controlsRef.current?.zoomIn(),
    onZoomOut: () => controlsRef.current?.zoomOut(),
    onFit: () => controlsRef.current?.fit(),
  };
}
