"use client";

import { type RefObject, useEffect, useState } from "react";

import { formatMegabytes, preloadAssets, type IAsset } from "@/core/services/assets";
import { APP_VERSION, rememberAppVersion, storedAppVersion } from "@/core/services/version";
import {
  ARENA_ASSETS,
  ARENA_ASSET_CONCURRENCY,
  ARENA_ASSET_FILES_LIMIT_MS,
  ARENA_ASSET_FILES_SHARE,
  ARENA_ASSET_SCREEN_FADE_MS,
  ARENA_ASSET_SCREEN_MIN_MS,
  ARENA_ASSET_STAGE_WAIT_MS,
  ARENA_ASSET_TEXTS,
  ARENA_ASSET_WARM_LIMIT_MS,
} from "@/modules/arena/arena.constants";
import type { IArenaStageControls } from "@/modules/arena/arena.types";
import { fetchArenaMapUrls } from "@/modules/arena/services";

import { ARENA_EFFECTS_TOTAL } from "./useArenaAssets.constants";
import { savesData, stageControls, withLimit } from "./useArenaAssets.utils";

type ScreenState = "open" | "closing" | "hidden";

interface ILoadState {
  ratio: number;
  detail: string;
}

/**
 * Gets the Arena ready behind the loading screen, so the session flows without waiting: downloads its own files
 * (`ARENA_ASSETS`, the world map), puts the map of every scene in the browser cache, the live one first (switching
 * maps is then instant), and plays every animation once out of sight (their shaders compile now, not on the first
 * blow). Files download `ARENA_ASSET_CONCURRENCY` at a time and hold the screen at most
 * `ARENA_ASSET_FILES_LIMIT_MS` (the rest keeps warming the cache behind the Arena); with data saving on, only the
 * Arena's own files load. The screen is the first thing shown, stays at least `ARENA_ASSET_SCREEN_MIN_MS` and fades
 * out once all is in; after a version bump it says it is updating (every versioned file downloads again). The
 * progress updates once per frame at most. Nothing loads while `enabled` is false (the phone, where the Arena shows
 * no map).
 */
export function useArenaAssets(
  enabled: boolean,
  controlsRef: RefObject<IArenaStageControls | null>,
) {
  const [load, setLoad] = useState<ILoadState>({ ratio: 0, detail: ARENA_ASSETS[0].label });
  const [state, setState] = useState<ScreenState>("open");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let filesPhase = true;
    let fade = 0;
    let close = 0;
    let frame = 0;
    let queued: ILoadState | null = null;
    const show = (next: ILoadState) => {
      queued = next;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (alive && queued) setLoad(queued);
        queued = null;
      });
    };
    const shownAt = performance.now();
    const previous = storedAppVersion();
    const run = async () => {
      const maps = savesData() ? [] : await fetchArenaMapUrls();
      if (alive && previous !== null && previous !== APP_VERSION) setUpdating(true);
      const assets: IAsset[] = [
        ...ARENA_ASSETS,
        ...maps.map((url) => ({ url, label: ARENA_ASSET_TEXTS.maps, keep: false })),
      ];
      const files = preloadAssets(
        assets,
        (progress) => {
          if (!alive || !filesPhase) return;
          const total = progress.totalBytes ? formatMegabytes(progress.totalBytes) : null;
          show({
            ratio: progress.ratio * ARENA_ASSET_FILES_SHARE,
            detail: progress.done
              ? ARENA_ASSET_TEXTS.effects
              : ARENA_ASSET_TEXTS.detail(
                  progress.current,
                  formatMegabytes(progress.loadedBytes),
                  total,
                ),
          });
        },
        ARENA_ASSET_CONCURRENCY,
      );
      await withLimit(files, ARENA_ASSET_FILES_LIMIT_MS);
      filesPhase = false;
      const controls = await stageControls(controlsRef, ARENA_ASSET_STAGE_WAIT_MS);
      if (controls && alive) {
        await withLimit(
          controls.warmEffects((ratio) => {
            if (!alive) return;
            show({
              ratio: ARENA_ASSET_FILES_SHARE + ratio * (1 - ARENA_ASSET_FILES_SHARE),
              detail: ARENA_ASSET_TEXTS.effectsDetail(
                Math.round(ratio * ARENA_EFFECTS_TOTAL),
                ARENA_EFFECTS_TOTAL,
              ),
            });
          }),
          ARENA_ASSET_WARM_LIMIT_MS,
        );
      }
      rememberAppVersion();
    };
    void run()
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        const wait = Math.max(ARENA_ASSET_SCREEN_MIN_MS - (performance.now() - shownAt), 0);
        close = window.setTimeout(() => {
          if (!alive) return;
          setState("closing");
          fade = window.setTimeout(() => {
            if (alive) setState("hidden");
          }, ARENA_ASSET_SCREEN_FADE_MS);
        }, wait);
      });
    return () => {
      alive = false;
      window.clearTimeout(close);
      window.clearTimeout(fade);
      window.cancelAnimationFrame(frame);
    };
  }, [enabled, controlsRef]);

  if (!enabled || state === "hidden") return { assetScreen: null };
  return {
    assetScreen: {
      progress: state === "closing" ? 1 : load.ratio,
      title: updating ? ARENA_ASSET_TEXTS.updating(APP_VERSION) : ARENA_ASSET_TEXTS.title,
      label: ARENA_ASSET_TEXTS.label,
      detail: state === "closing" ? ARENA_ASSET_TEXTS.detail(null, "", null) : load.detail,
      version: ARENA_ASSET_TEXTS.version(APP_VERSION),
      closing: state === "closing",
    },
  };
}
