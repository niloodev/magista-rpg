"use client";

import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { openPopout } from "@/core/services/windows";
import {
  ARENA_SHEET_WINDOW_LAYOUT,
  ARENA_SHEET_WINDOW_TEXTS,
} from "@/modules/arena/arena.constants";
import type { ArenaDockSide } from "@/modules/arena/arena.types";
import { dockZoneAt, sheetNameOf } from "@/modules/arena/arena.utils";
import { sheetNames } from "@/modules/sheet/store";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { clampWindowRect, WINDOW_MIN_SIZE, type IWindowRect } from "@/shared/components/organisms";

import type { ArenaSheetWindowsProps, IArenaSheetWindow } from "./ArenaSheetWindows.types";
import {
  defaultSheetWindowRect,
  omitRect,
  readSavedRect,
  sheetWindowKey,
} from "./ArenaSheetWindows.utils";

/**
 * Floating sheet windows of the Arena: the open ones come from the store (bottom to top); position and size
 * start next to the roll feed (or where the window was last time on this device) and are saved on release.
 */
export function useArenaSheetWindows({ panels, onDock }: ArenaSheetWindowsProps) {
  const store = useAppStoreApi();
  const openSheets = useApp((state) => state.arena.openSheets);
  const slots = useApp((state) => state.arena.sheetSlots);
  const names = useApp(useShallow((state) => sheetNames(state.sheets)));
  const characters = useApp((state) => state.library.characters);
  const [rects, setRects] = useState<Record<string, IWindowRect>>({});
  const [drop, setDrop] = useState<{ id: string; side: ArenaDockSide } | null>(null);

  const windows = useMemo<IArenaSheetWindow[]>(
    () =>
      openSheets
        .map((id, stack) => {
          const name = sheetNameOf(id, names, characters);
          return {
            id,
            title: ARENA_SHEET_WINDOW_TEXTS.title(name),
            name,
            slot: slots[id] ?? stack,
            zIndex: ARENA_SHEET_WINDOW_LAYOUT.zBase + stack,
          };
        })
        .sort((a, b) => a.slot - b.slot),
    [openSheets, slots, names, characters],
  );

  const rectOf = useCallback(
    (id: string, index: number): IWindowRect => {
      const current = rects[id];
      if (current) return current;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const saved = readSavedRect(id);
      return saved
        ? clampWindowRect(saved, viewport, WINDOW_MIN_SIZE, ARENA_SHEET_WINDOW_LAYOUT.minTop)
        : defaultSheetWindowRect(index, panels, viewport);
    },
    [rects, panels],
  );

  const onRectChange = useCallback((id: string, rect: IWindowRect, commit: boolean) => {
    setRects((current) => ({ ...current, [id]: rect }));
    if (!commit) return;
    try {
      window.localStorage.setItem(sheetWindowKey(id), JSON.stringify(rect));
    } catch {
      return;
    }
  }, []);

  const dock = useCallback(
    (id: string, side: ArenaDockSide) => {
      setRects((current) => omitRect(current, id));
      try {
        window.localStorage.removeItem(sheetWindowKey(id));
      } catch {
        return onDock(id, side);
      }
      onDock(id, side);
    },
    [onDock],
  );

  const onDragPoint = useCallback(
    (id: string, point: { x: number; y: number }, done: boolean) => {
      const side = dockZoneAt(point.x, window.innerWidth, panels);
      if (!done) {
        setDrop(side ? { id, side } : null);
        return;
      }
      setDrop(null);
      if (side) dock(id, side);
    },
    [panels, dock],
  );

  return {
    windows,
    dropZone: drop?.side ?? null,
    dropWidth: drop ? panels[drop.side] : 0,
    ghostId: drop?.id ?? null,
    onDragPoint,
    onDockLeft: (id: string) => dock(id, "left"),
    onDockRight: (id: string) => dock(id, "right"),
    rectOf,
    onRectChange,
    onActivate: (id: string) => store.getState().openArenaSheet(id),
    onClose: (id: string) => store.getState().closeArenaSheet(id),
    onPopout: (id: string) => {
      openPopout({ kind: "sheet", id });
      store.getState().closeArenaSheet(id);
    },
  };
}
