"use client";

import { useMemo } from "react";

import { ARENA_HINT_KEY } from "@/modules/arena/arena.constants";
import { fitPanels, parseArenaHint } from "@/modules/arena/arena.utils";
import { useSkeletonHint } from "@/modules/shell/providers";
import { PRESENCE_HINT_KEY } from "@/modules/table/table.constants";
import { presenceRows } from "@/modules/table/table.utils";
import { useViewportWidth } from "@/shared/hooks";

/**
 * Shape of the last Arena seen on this device: tray size, scene name length (0 when no scene was live) and how
 * many people were at the table.
 */
export function useArenaSkeleton() {
  const arenaRaw = useSkeletonHint(ARENA_HINT_KEY);
  const presenceRaw = useSkeletonHint(PRESENCE_HINT_KEY);
  const hint = useMemo(() => parseArenaHint(arenaRaw), [arenaRaw]);
  const people = useMemo(() => presenceRows(presenceRaw).length, [presenceRaw]);
  const viewportWidth = useViewportWidth();
  const panels = fitPanels(hint.rollsWidth, hint.sidebarWidth, viewportWidth);
  return {
    trayRows: Array.from({ length: hint.tray }, (_, index) => index),
    noScene: hint.known && hint.nameLength === 0,
    sidebarWidth: panels.right,
    rollsWidth: panels.left,
    tab: hint.tab,
    known: hint.known,
    nameLength: hint.nameLength || 1,
    people: String(people),
  };
}
