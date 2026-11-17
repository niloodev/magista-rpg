"use client";

import { useCallback, useState } from "react";

import { ARENA_TURN_WINDOW_LAYOUT } from "@/modules/arena/arena.constants";
import { clampWindowRect, type IWindowRect } from "@/shared/components/organisms";

import type { ArenaTurnWindowProps } from "./ArenaTurnWindow.types";
import {
  defaultTurnWindowRect,
  readTurnWindowRect,
  saveTurnWindowRect,
} from "./ArenaTurnWindow.utils";

/**
 * Position and size of the turn order window: where it was last time on this device, else the top right of
 * the map area; saved on release.
 */
export function useArenaTurnWindow({ initialPanels }: Pick<ArenaTurnWindowProps, "initialPanels">) {
  const [rect, setRect] = useState<IWindowRect>(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const saved = readTurnWindowRect();
    const { min, top, gap } = ARENA_TURN_WINDOW_LAYOUT;
    return saved
      ? clampWindowRect(saved, viewport, min, top - gap)
      : defaultTurnWindowRect(initialPanels(), viewport);
  });

  const onRectChange = useCallback((next: IWindowRect, commit: boolean) => {
    setRect(next);
    if (commit) saveTurnWindowRect(next);
  }, []);

  return { rect, onRectChange };
}
