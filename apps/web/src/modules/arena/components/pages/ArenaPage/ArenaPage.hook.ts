"use client";

import {
  ARENA_SCENE_NOT_FOUND_MESSAGE,
  ARENA_TOKEN_SIZE_DEFAULT,
  clampToMap,
  isErrorResult,
  type IArenaBounds,
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
  dockedTabsOf,
  sheetNameOf,
  tokenDisplayName,
} from "@/modules/arena/arena.utils";
import {
  deleteArenaTokens,
  fetchArena,
  moveArenaTokens,
  setArenaLiveScene,
  updateArenaTokens,
} from "@/modules/arena/services";
import {
  useArenaTokenActions,
  useArenaTokenPlacement,
  useArenaTokenStatus,
} from "@/modules/arena/hooks";
import { sheetNames } from "@/modules/sheet/store";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { useIsDesktopViewport, useStableCallback, useViewportWidth } from "@/shared/hooks";

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
  const { status, view, error, selectedTokenIds, viewSceneId, docked, dockTab } = useApp(
    useShallow((state) => ({
      status: state.arena.status,
      view: state.arena.view,
      error: state.arena.error,
      selectedTokenIds: state.arena.selectedTokenIds,
      viewSceneId: state.arena.viewSceneId,
      docked: state.arena.docked,
      dockTab: state.arena.dockTab,
    })),
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
  const nudgeTimer = useRef(0);
  const pendingNudge = useRef(new Map<string, IArenaPoint>());
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
    const { applyArenaToken, removeArenaToken, applyArenaTokens, removeArenaTokens } =
      store.getState();
    const onScene = (event: IArenaSceneEvent) => {
      if (!event.libraryOnly) void load();
    };
    socket.on("arena:scene", onScene);
    socket.on("arena:token", applyArenaToken);
    socket.on("arena:token-removed", removeArenaToken);
    socket.on("arena:tokens", applyArenaTokens);
    socket.on("arena:tokens-removed", removeArenaTokens);
    return () => {
      socket.off("arena:scene", onScene);
      socket.off("arena:token", applyArenaToken);
      socket.off("arena:token-removed", removeArenaToken);
      socket.off("arena:tokens", applyArenaTokens);
      socket.off("arena:tokens-removed", removeArenaTokens);
    };
  }, [socket, store, load]);

  const renderTokens = useMemo(
    () => (view ? toRenderTokens(view, isGm, toMediaUrl) : []),
    [view, isGm],
  );

  const trayTokens = useMemo(
    () =>
      renderTokens
        .filter((token) => !isGm && token.controllable)
        .map(({ id, name, imageUrl, style, tone, hidden }) => {
          const token = view?.tokens.find((entry) => entry.id === id);
          return {
            id,
            name,
            imageUrl: token?.imageThumbUrl ? toMediaUrl(token.imageThumbUrl) : imageUrl,
            style,
            tone,
            hidden,
          };
        }),
    [renderTokens, isGm, view],
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
      if (first)
        setAnnouncement(ARENA_MOVED_LABEL(tokenDisplayName(first, isGm), result.tokens.length));
    },
    [socket, store, load, isGm],
  );

  const onSelect = useCallback(
    (tokenIds: string[], mode: ArenaSelectionMode) =>
      store.getState().selectArenaTokens(tokenIds, mode),
    [store],
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

  const onSizeChange = useStableCallback((size: number | null) => {
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
  });

  const tokenStatus = useArenaTokenStatus({ isGm, controlsRef, onAnnounce: setAnnouncement });
  const { openChangeMenu } = tokenStatus;
  const summary = selectionSummary(selectedTokens, isGm, view?.controllableCharacterIds ?? []);
  const { allHidden, sheetTarget } = summary;

  const onToggleHidden = useStableCallback(
    () => void saveTokens(selectedTokens.map((token) => ({ id: token.id, hidden: !allHidden }))),
  );

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

  const onPickToken = useStableCallback((tokenId: string) => {
    store.getState().selectArenaTokens([tokenId], "replace");
    controlsRef.current?.centerOn(tokenId);
  });

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

  const liveSceneId = view?.activeSceneId ?? null;
  const viewingSceneId = view?.scene?.id ?? null;

  const onPreviewScene = useStableCallback((sceneId: string) =>
    store.getState().setArenaViewScene(sceneId === liveSceneId ? null : sceneId),
  );

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

  const broadcastLive = view?.scene ? view.scene.id === view.activeSceneId : false;
  const broadcastHasLive = (view?.activeSceneId ?? null) !== null;
  const broadcastShown = isGm && Boolean(view?.scene);
  const broadcast = useMemo(
    () => (broadcastShown ? { live: broadcastLive, hasLive: broadcastHasLive } : null),
    [broadcastShown, broadcastLive, broadcastHasLive],
  );

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

  const onDock = useStableCallback((characterId: string, side: ArenaDockSide) => {
    store.getState().dockArenaSheet(characterId, side);
    updateSidebar(side === "left" ? { rollsOpen: true } : { open: true });
  });

  const openSheet = useStableCallback((characterId: string) => {
    const side = dockSideOf(docked, characterId);
    if (!side) {
      store.getState().openArenaSheet(characterId);
      return;
    }
    store.getState().showDockTab(side, characterId);
    updateSidebar(side === "left" ? { rollsOpen: true } : { open: true });
  });

  const showDockTab = useApp((state) => state.showDockTab);
  const dockedLeft = useMemo(
    () => dockedTabsOf("left", docked, dockTab, namesById, libraryCharacters, showDockTab),
    [docked, dockTab, namesById, libraryCharacters, showDockTab],
  );
  const dockedRight = useMemo(
    () => dockedTabsOf("right", docked, dockTab, namesById, libraryCharacters, showDockTab),
    [docked, dockTab, namesById, libraryCharacters, showDockTab],
  );
  const windowPanels = useMemo(
    () => ({ left: insetLeft, right: insetRight }),
    [insetLeft, insetRight],
  );
  const onUndock = useStableCallback((characterId: string) =>
    store.getState().undockArenaSheet(characterId),
  );
  const onCloseDocked = useStableCallback((characterId: string) =>
    store.getState().closeDockedSheet(characterId),
  );
  const onGoLiveStable = useStableCallback((sceneId: string) => void onGoLive(sceneId));
  const onOpenProfile = useStableCallback(() => setProfileOpen(true));
  const onRequestRemove = useStableCallback(() => setConfirmRemove(true));
  const onGoLiveViewed = useStableCallback(() => {
    if (viewingSceneId) void onGoLive(viewingSceneId);
  });
  const onBackToLive = useStableCallback(() => store.getState().setArenaViewScene(null));
  const onZoomIn = useStableCallback(() => controlsRef.current?.zoomIn());
  const onZoomOut = useStableCallback(() => controlsRef.current?.zoomOut());
  const onFit = useStableCallback(() => controlsRef.current?.fit());

  const scene = view?.scene ?? null;
  const placement = useArenaTokenPlacement({
    sceneId: scene?.id ?? null,
    enabled: status === "ready",
    controlsRef,
    boundsRef,
    onError: setActionError,
  });
  const onPlaceCharacter = useStableCallback(placement.placeCharacter);
  const onDropCharacter = useStableCallback(placement.dropCharacter);
  const onNewNpc = useStableCallback(placement.openNpcDialog);
  const onDropFiles = useStableCallback(placement.dropImages);
  const onDropCharacterId = useStableCallback(
    (characterId: string, point: { x: number; y: number }) => {
      const character = libraryCharacters.find((entry) => entry.id === characterId);
      if (character) placement.dropCharacter(character, point);
    },
  );
  const stageScene = useMemo(
    () =>
      scene
        ? {
            id: scene.id,
            mapUrl: toMediaUrl(scene.mapUrl),
            width: scene.width,
            height: scene.height,
          }
        : null,
    [scene],
  );

  const onOpenSelectedSheet = useStableCallback(() => {
    if (sheetTarget) openSheet(sheetTarget);
  });

  const controllableIds = useMemo(
    () => new Set(renderTokens.filter((token) => token.controllable).map((token) => token.id)),
    [renderTokens],
  );
  const canRemove =
    selectedTokens.length > 0 &&
    (isGm || selectedTokens.every((token) => controllableIds.has(token.id)));
  const onApplyChangeAt = useStableCallback((point: IArenaPoint) => openChangeMenu(null, point));
  const tokenActions = useArenaTokenActions({
    isGm,
    sceneId: scene?.id ?? null,
    selectedTokens,
    selectedTokenIds,
    controlsRef,
    boundsRef,
    allHidden,
    canOpenSheet: sheetTarget !== null,
    canRemove,
    onApplyChange: onApplyChangeAt,
    onConfigure: tokenStatus.openSettings,
    onToggleHidden,
    onOpenSheet: onOpenSelectedSheet,
    onRemove: onRequestRemove,
    onAnnounce: setAnnouncement,
    onError: setActionError,
  });
  const onTokenMenu = useStableCallback((tokenId: string | null, client: IArenaPoint) =>
    tokenActions.openMenu(tokenId, client),
  );

  const onStageKeyDown = useStableCallback((event: KeyboardEvent<HTMLDivElement>) => {
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
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "c") {
      if (tokenActions.copySelection()) event.preventDefault();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "v") {
      if (tokenActions.paste()) event.preventDefault();
      return;
    }
    if (
      (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) &&
      selectedTokens.length > 0
    ) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      tokenActions.openMenu(selectedTokens[0]?.id ?? null, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      return;
    }
    if (event.key.toLowerCase() === "m" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (selectedTokens.length === 0) return;
      event.preventDefault();
      openChangeMenu(null, null);
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && canRemove) {
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
  });

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
    memberCount,
    controlsRef,
    announcement,
    profileOpen,
    onOpenProfile,
    onCloseProfile: () => setProfileOpen(false),
    onRetry: () => void load(),
    onSelect,
    onDrop: (moves: IMoveArenaTokenInput[]) => void commitMoves(moves),
    onResize,
    selection:
      selectedTokens.length > 0
        ? {
            label: ARENA_SELECTION_TEXTS.count(selectedTokens.length),
            size: summary.size,
            allHidden,
            canOpenSheet: sheetTarget !== null,
            status: tokenStatus.selectionStatus,
          }
        : null,
    onTokenMenu,
    tokenMenu: tokenActions.menu ? { ...tokenActions.menu, onClose: tokenActions.closeMenu } : null,
    changeMenu: tokenStatus.changeMenu
      ? {
          target: tokenStatus.changeMenu.target,
          targetImages: tokenStatus.changeMenu.targetImages,
          anchor: tokenStatus.changeMenu.anchor,
          preference: tokenStatus.changePreference,
          onPreferenceChange: tokenStatus.updateChange,
          effectLabel: tokenStatus.effectLabel,
          autoStyle: tokenStatus.autoStyle,
          onPickEffect: tokenStatus.openEffectPicker,
          suspended: tokenStatus.effectPickerOpen,
          attackers: tokenStatus.attackerOptions,
          attackerId: tokenStatus.attackerId,
          onAttackerChange: tokenStatus.setAttackerId,
          error: tokenStatus.changeError,
          pending: tokenStatus.changePending,
          onApply: tokenStatus.applyChange,
          onClose: tokenStatus.closeChangeMenu,
        }
      : null,
    changeMenuInBar: tokenStatus.changeMenu?.anchor === null,
    effectPicker:
      tokenStatus.changeMenu && tokenStatus.effectPickerOpen
        ? {
            kind: tokenStatus.changePreference.kind,
            resource: tokenStatus.changePreference.resource,
            value: tokenStatus.changePreference.effect,
            autoStyle: tokenStatus.autoStyle,
            onChoose: tokenStatus.chooseEffect,
            onClose: tokenStatus.closeEffectPicker,
          }
        : null,
    tokenSettings:
      isGm && tokenStatus.settings
        ? {
            target: tokenStatus.settings,
            accounts: tokenStatus.accounts,
            accountsStatus: tokenStatus.accountsStatus,
            onRetryAccounts: tokenStatus.retryAccounts,
            onSubmit: tokenStatus.saveSettings,
            onOpenSheet: openSheet,
            onClose: tokenStatus.closeSettings,
          }
        : null,
    onSizeChange,
    confirmRemove,
    confirmRemoveTitle: ARENA_SELECTION_TEXTS.confirmTitle(selectedTokens.length),
    confirmRemoveMessage: ARENA_SELECTION_TEXTS.confirmMessage(selectedTokens.length),
    onConfirmRemove: () => void onConfirmRemove(),
    onCancelRemove: () => setConfirmRemove(false),
    onBounds,
    onPickToken,
    onStageKeyDown,
    stageInsetRight: insetRight,
    stageInsetLeft: insetLeft,
    hudStyle: windowPanels,
    sidebarWidth: insetRight || sidebar.width,
    rollsWidth: insetLeft || sidebar.rollsWidth,
    onSidebarResize: (width: number) => updateSidebar({ width }, false),
    onSidebarResizeCommit: (width: number) => updateSidebar({ width }),
    onRollsResize: (rollsWidth: number) => updateSidebar({ rollsWidth }, false),
    onRollsResizeCommit: (rollsWidth: number) => updateSidebar({ rollsWidth }),
    rollsOpen: sidebar.rollsOpen,
    onRollsOpen: (rollsOpen: boolean) => updateSidebar({ rollsOpen }),
    broadcast,
    onGoLiveViewed,
    onBackToLive,
    sidebarOpen: sidebar.open,
    sidebarTab: !isGm && sidebar.tab === "scenes" ? "characters" : sidebar.tab,
    onSidebarTab: (tab: ArenaSidebarTab) => updateSidebar({ tab }),
    onSidebarOpen: (open: boolean) => updateSidebar({ open }),
    onOpenCharacter: openSheet,
    dockedLeft,
    dockedRight,
    windowPanels,
    onDock,
    onUndock,
    sheetNameFor: (characterId: string) => sheetNameOf(characterId, namesById, libraryCharacters),
    onCloseDocked,
    canPlace: Boolean(scene) && status === "ready",
    isOverMap,
    tokenPreviewSize,
    onPlaceCharacter,
    onDropCharacter,
    npcDialogOpen: placement.npcDialogOpen,
    onNewNpc,
    onCloseNpc: placement.closeNpcDialog,
    selectionSlotClassName: `${ARENA_SELECTION_BAR_SLOT.base} ${
      trayTokens.length > 0
        ? ARENA_SELECTION_BAR_SLOT.bottom.aboveTray
        : ARENA_SELECTION_BAR_SLOT.bottom.free
    }`,
    onSubmitNpc: placement.submitNpc,
    onDropFiles: isGm && scene && status === "ready" ? onDropFiles : undefined,
    onDropCharacterId: !isGm && scene && status === "ready" ? onDropCharacterId : undefined,
    imageDrop: placement.imageDropFiles
      ? {
          files: placement.imageDropFiles,
          onSubmit: placement.submitImageDrop,
          onClose: placement.closeImageDrop,
        }
      : null,
    liveSceneId,
    viewingSceneId,
    onPreviewScene,
    onGoLive: onGoLiveStable,
    rolls,
    pendingRolls,
    rollsLoading: !rollsLoaded && connection !== "disconnected",
    onZoomIn,
    onZoomOut,
    onFit,
  };
}
