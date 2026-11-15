"use client";

import { useMemo } from "react";

import { ARENA_HINT_KEY } from "@/modules/arena/arena.constants";
import { parseArenaHint } from "@/modules/arena/arena.utils";
import { useSkeletonHint } from "@/modules/shell/providers";
import { PRESENCE_HINT_KEY } from "@/modules/table/table.constants";
import { presenceRows } from "@/modules/table/table.utils";

/**
 * Shape of the last Arena seen on this device: tray size, scene name length (0 when no scene was live) and how
 * many people were at the table.
 */
export function useArenaSkeleton() {
  const arenaRaw = useSkeletonHint(ARENA_HINT_KEY);
  const presenceRaw = useSkeletonHint(PRESENCE_HINT_KEY);
  const hint = useMemo(() => parseArenaHint(arenaRaw), [arenaRaw]);
  const people = useMemo(() => presenceRows(presenceRaw).length, [presenceRaw]);
  return {
    trayRows: Array.from({ length: hint.tray }, (_, index) => index),
    noScene: hint.known && hint.nameLength === 0,
    sidebarWidth: hint.sidebarWidth,
    rollsWidth: hint.rollsWidth,
    tab: hint.tab,
    known: hint.known,
    nameLength: hint.nameLength || 1,
    people: String(people),
  };
}
