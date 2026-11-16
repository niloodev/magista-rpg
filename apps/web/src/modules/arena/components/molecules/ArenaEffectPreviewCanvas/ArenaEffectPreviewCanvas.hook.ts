"use client";

import { useEffect, useRef, useState } from "react";

import { ARENA_EFFECT_TEXTS } from "@/modules/arena/arena.constants";
import type { ArenaEffectPreview } from "@/modules/arena/services/arenaEffectPreview";
import { usePrefersReducedMotion } from "@/shared/hooks";

import type { ArenaEffectPreviewCanvasProps } from "./ArenaEffectPreviewCanvas.types";
import { readSerifFont } from "./ArenaEffectPreviewCanvas.utils";

/**
 * Loads the preview stage on demand (pixi stays out of the page bundle), recreates it when the performance mode
 * changes and plays the chosen animation: looping by default, once with reduced motion or the performance
 * mode, and the viewer can pause it or play it again.
 */
export function useArenaEffectPreviewCanvas({ play }: Pick<ArenaEffectPreviewCanvasProps, "play">) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<ArenaEffectPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const lite = usePrefersReducedMotion();
  const [paused, setPaused] = useState<boolean | null>(null);
  const looping = paused === null ? !lite : !paused;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let created: ArenaEffectPreview | null = null;
    void (async () => {
      const { ArenaEffectPreview } = await import("@/modules/arena/services/arenaEffectPreview");
      if (disposed) return;
      try {
        created = await ArenaEffectPreview.create(host, { fontFamily: readSerifFont(), lite });
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) {
        created.destroy();
        return;
      }
      setPreview(created);
    })();
    return () => {
      disposed = true;
      created?.destroy();
      setPreview(null);
    };
  }, [lite]);

  const { style, kind, resource, withAttacker } = play;

  useEffect(() => {
    preview?.play({ style, kind, resource, withAttacker });
  }, [preview, style, kind, resource, withAttacker]);

  useEffect(() => {
    preview?.setLooping(looping);
  }, [preview, looping]);

  const toggle = () => {
    if (!looping) preview?.play({ style, kind, resource, withAttacker });
    setPaused(looping);
  };

  return {
    hostRef,
    loading: !preview && !failed,
    looping,
    toggle,
    toggleLabel: looping ? ARENA_EFFECT_TEXTS.pause : ARENA_EFFECT_TEXTS.replay,
  };
}
