"use client";

import {
  WORLD_FOG_POINTS_MAX,
  type IArenaWorldFogEvent,
  type IWorldFogStroke,
  type IWorldPoint,
  type WorldFogMode,
} from "@magista/shared";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ARENA_WORLD_VIEW,
  WORLD_BRUSH,
  WORLD_FOG_GM_ALPHA,
  WORLD_PAINT_FLUSH_MS,
  WORLD_TEXTS,
} from "@/modules/arena/arena.constants";
import type { IWorldFogTools, WorldFogTool } from "@/modules/arena/arena.types";
import { roundPoint } from "@/modules/arena/arena.utils";
import { moveWorldParty, paintWorldFog, setArenaWorldLive } from "@/modules/arena/services";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { useStableCallback } from "@/shared/hooks";

import type { UseArenaWorldProps } from "./useArenaWorld.types";
import { appendStroke, shownFog } from "./useArenaWorld.utils";

/**
 * The world map of the Arena: follows the party token and the fog sent by the server, moves the party (with the
 * new spot shown at once), puts the world map live or back, and gives the GM the fog brush. Brush segments are
 * gathered into batches sent every `WORLD_PAINT_FLUSH_MS`; until the server confirms a batch it stays painted
 * over the server fog (and a confirmation first sends the batch still being gathered), so the GM's stroke never
 * flickers back. While this tab moves the party, the echoes of its own moves are ignored and only the newest
 * answer counts, so the token never steps back during quick moves.
 */
export function useArenaWorld({ isGm, onAnnounce, onError, onReload }: UseArenaWorldProps) {
  const socket = useTableSocket();
  const store = useAppStoreApi();
  const world = useApp((state) => state.arena.view?.world ?? null);
  const worldLive = useApp((state) => state.arena.view?.worldLive ?? false);
  const [tool, setTool] = useState<WorldFogTool>("move");
  const [radius, setRadius] = useState<number>(WORLD_BRUSH.default);
  const [playerView, setPlayerView] = useState(false);
  const [pending, setPending] = useState<IWorldFogStroke[]>([]);
  const [filling, setFilling] = useState(false);
  const [confirmFill, setConfirmFill] = useState<WorldFogMode | null>(null);
  const batchRef = useRef<IWorldFogStroke | null>(null);
  const flushTimer = useRef(0);
  const flushRef = useRef<() => void>(() => undefined);
  const movesInFlight = useRef(0);
  const lastMove = useRef(0);

  useEffect(() => {
    if (!socket) return;
    const onParty = (party: IWorldPoint) => {
      if (movesInFlight.current === 0) store.getState().applyWorldParty(party);
    };
    const onFog = (event: IArenaWorldFogEvent) => store.getState().applyWorldFog(event);
    socket.on("arena:world-party", onParty);
    socket.on("arena:world-fog", onFog);
    return () => {
      socket.off("arena:world-party", onParty);
      socket.off("arena:world-fog", onFog);
    };
  }, [socket, store]);

  useEffect(() => () => window.clearTimeout(flushTimer.current), []);

  const flush = useStableCallback(() => {
    window.clearTimeout(flushTimer.current);
    flushTimer.current = 0;
    const batch = batchRef.current;
    batchRef.current = null;
    if (!batch || batch.points.length === 0) return;
    setPending((previous) => [...previous, batch]);
    void paintWorldFog(socket, batch).then((result) => {
      if (result.ok) {
        flushRef.current();
        store.getState().applyWorldFog(result.fog);
      } else {
        onError(result.error);
        onReload();
      }
      setPending((previous) => previous.filter((entry) => entry !== batch));
    });
  });

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const onFogStroke = useStableCallback((segment: IWorldFogStroke) => {
    const current = batchRef.current;
    if (current && (current.mode !== segment.mode || current.radius !== segment.radius)) flush();
    batchRef.current = appendStroke(batchRef.current, segment);
    if (batchRef.current.points.length >= WORLD_FOG_POINTS_MAX - 1) {
      flush();
      return;
    }
    if (!flushTimer.current) flushTimer.current = window.setTimeout(flush, WORLD_PAINT_FLUSH_MS);
  });

  const serverFog = world?.fog ?? null;
  const worldFog = useMemo(
    () => (serverFog === null ? null : shownFog(serverFog, pending)),
    [serverFog, pending],
  );

  const moveParty = useStableCallback(async (point: IWorldPoint) => {
    const target = roundPoint(point);
    const move = ++lastMove.current;
    store.getState().applyWorldParty(target);
    movesInFlight.current += 1;
    const result = await moveWorldParty(socket, target).finally(() => {
      movesInFlight.current -= 1;
    });
    if (move !== lastMove.current) return;
    if (!result.ok) {
      onError(result.error);
      onReload();
      return;
    }
    onError(null);
    store.getState().applyWorldParty(result.party);
    onAnnounce(WORLD_TEXTS.partyMoved);
  });

  const setLive = useStableCallback(async (live: boolean) => {
    const result = await setArenaWorldLive(live);
    if ("error" in result) {
      onError(result.error);
      return;
    }
    onError(null);
    store.getState().setArenaViewScene(null);
    onAnnounce(live ? WORLD_TEXTS.wentLive : WORLD_TEXTS.backToScene);
  });

  const previewWorld = useStableCallback(() =>
    store.getState().setArenaViewScene(worldLive ? null : ARENA_WORLD_VIEW),
  );

  const onConfirmFill = useStableCallback(async () => {
    const mode = confirmFill;
    setConfirmFill(null);
    if (!mode) return;
    flush();
    setFilling(true);
    const result = await paintWorldFog(socket, { mode, fill: true });
    setFilling(false);
    if (result.ok) {
      onError(null);
      store.getState().applyWorldFog(result.fog);
    } else onError(result.error);
  });

  const onRadius = useStableCallback((value: number | null) => {
    if (value === null) return;
    setRadius(Math.min(Math.max(value, WORLD_BRUSH.min), WORLD_BRUSH.max));
  });

  const shown = world !== null;
  const brush = isGm && shown && tool !== "move" ? { mode: tool, radius } : null;
  const fogAlpha = isGm && !playerView ? WORLD_FOG_GM_ALPHA : 1;
  const fogTools = useMemo<IWorldFogTools | null>(
    () =>
      isGm && shown
        ? {
            tool,
            radius,
            playerView,
            pending: filling,
            onTool: setTool,
            onRadius,
            onPlayerView: setPlayerView,
            onFill: setConfirmFill,
          }
        : null,
    [isGm, shown, tool, radius, playerView, filling, onRadius],
  );

  return {
    world,
    worldLive,
    worldFog,
    fogAlpha,
    brush,
    onFogStroke,
    moveParty,
    setLive,
    previewWorld,
    fogTools,
    confirmFill,
    onConfirmFill,
    onCancelFill: () => setConfirmFill(null),
  };
}
