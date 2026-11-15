"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

import {
  ARENA_BOTTOM_INSET,
  ARENA_TOP_BAR_HEIGHT,
  ARENA_ZOOM_STEP,
} from "@/modules/arena/arena.constants";
import type { ArenaStageStatus } from "@/modules/arena/arena.types";
import type { IArenaRenderer } from "@/modules/arena/services/arenaRenderer";
import { usePrefersReducedMotion } from "@/shared/hooks";

import type { ArenaStageHookProps } from "./ArenaStage.types";
import { readSerifFont } from "./ArenaStage.utils";

/**
 * Owns the PixiJS board: loads the renderer on demand (keeping pixi.js out of every other page), recreates it
 * when the performance mode changes, and pushes scene, tokens and selection into it. Reports "unsupported" when
 * WebGL is missing, and "ready" once the first scene is drawn.
 */
export function useArenaStage({
  scene,
  tokens,
  selectedTokenIds,
  controlsRef,
  onSelect,
  onDrop,
  onResize,
  resizable,
  insetRight,
  insetLeft,
  onBounds,
  onMapError,
}: ArenaStageHookProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<IArenaRenderer | null>(null);
  const callbacksRef = useRef({ onSelect, onDrop, onResize, onBounds, onMapError });
  const [renderer, setRenderer] = useState<IArenaRenderer | null>(null);
  const [status, setStatus] = useState<ArenaStageStatus>("loading");
  const lite = usePrefersReducedMotion();

  useEffect(() => {
    callbacksRef.current = { onSelect, onDrop, onResize, onBounds, onMapError };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let created: IArenaRenderer | null = null;
    const start = async () => {
      const fontFamily = readSerifFont();
      await document.fonts.ready;
      const { ArenaRenderer } = await import("@/modules/arena/services/arenaRenderer");
      if (disposed) return;
      try {
        created = await ArenaRenderer.create(host, {
          lite,
          insetTop: ARENA_TOP_BAR_HEIGHT,
          insetBottom: ARENA_BOTTOM_INSET,
          fontFamily,
          callbacks: {
            onSelect: (ids, mode) => callbacksRef.current.onSelect(ids, mode),
            onDrop: (moves) => callbacksRef.current.onDrop(moves),
            onResize: (updates) => callbacksRef.current.onResize(updates),
            onMapError: (failed) => {
              if (!disposed) callbacksRef.current.onMapError(failed);
            },
            onSceneReady: (bounds) => {
              if (disposed) return;
              callbacksRef.current.onBounds(bounds);
              setStatus("ready");
            },
          },
        });
      } catch {
        if (!disposed) setStatus("unsupported");
        return;
      }
      if (disposed) {
        created.destroy();
        return;
      }
      rendererRef.current = created;
      setRenderer(created);
    };
    void start();
    return () => {
      disposed = true;
      created?.destroy();
      rendererRef.current = null;
      setRenderer(null);
      setStatus("loading");
    };
  }, [lite]);

  const sceneId = scene?.id ?? null;
  const mapUrl = scene?.mapUrl ?? null;
  const boardWidth = scene?.width ?? 0;
  const boardHeight = scene?.height ?? 0;

  useEffect(() => {
    renderer?.setSideInsets(insetLeft, insetRight);
  }, [renderer, insetLeft, insetRight]);

  useEffect(() => {
    if (!renderer) return;
    void renderer.setScene(
      sceneId ? { id: sceneId, mapUrl, width: boardWidth, height: boardHeight } : null,
    );
  }, [renderer, sceneId, mapUrl, boardWidth, boardHeight]);

  useEffect(() => {
    renderer?.setTokens(tokens);
  }, [renderer, tokens]);

  useEffect(() => {
    renderer?.setSelection(selectedTokenIds);
  }, [renderer, selectedTokenIds]);

  useEffect(() => {
    renderer?.setResizable(resizable);
  }, [renderer, resizable]);

  useImperativeHandle(
    controlsRef,
    () => ({
      zoomIn: () => rendererRef.current?.zoomBy(ARENA_ZOOM_STEP),
      zoomOut: () => rendererRef.current?.zoomBy(1 / ARENA_ZOOM_STEP),
      fit: () => rendererRef.current?.fitToMap(),
      centerOn: (tokenId) => rendererRef.current?.centerOn(tokenId),
      clientToWorld: (clientX, clientY) =>
        rendererRef.current?.clientToWorld(clientX, clientY) ?? null,
      visibleCenter: () => rendererRef.current?.visibleCenter() ?? null,
      zoom: () => rendererRef.current?.zoom() ?? 1,
      retryMap: () => rendererRef.current?.retryMap(),
    }),
    [],
  );

  return { hostRef, status };
}
