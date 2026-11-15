"use client";

import {
  ARENA_DOCK_TEXTS,
  ARENA_SHEET_WINDOW_LAYOUT,
  ARENA_SHEET_WINDOW_TEXTS,
  ARENA_WINDOW_ICON_BUTTON,
} from "@/modules/arena/arena.constants";
import { SheetPage } from "@/modules/sheet/components/pages";
import { Icon } from "@/shared/components/atoms";
import { FloatingWindow } from "@/shared/components/organisms";

import { ArenaDockHint } from "../../molecules";
import { useArenaSheetWindows } from "./ArenaSheetWindows.hook";
import type { ArenaSheetWindowsProps } from "./ArenaSheetWindows.types";

/**
 * Sheets open over the Arena in floating windows (several at once, the pressed one comes to the front), each
 * with the full sheet in its panel layout and a button to move it to a browser window.
 */
export function ArenaSheetWindows(props: ArenaSheetWindowsProps) {
  const {
    windows,
    dropZone,
    dropWidth,
    ghostId,
    onDragPoint,
    onDockLeft,
    onDockRight,
    rectOf,
    onRectChange,
    onActivate,
    onClose,
    onPopout,
  } = useArenaSheetWindows(props);
  return (
    <>
      {windows.map((item) => (
        <FloatingWindow
          key={item.id}
          title={item.title}
          rect={rectOf(item.id, item.slot)}
          zIndex={item.zIndex}
          ghost={ghostId === item.id}
          minTop={ARENA_SHEET_WINDOW_LAYOUT.minTop}
          onRectChange={(rect, commit) => onRectChange(item.id, rect, commit)}
          onActivate={() => onActivate(item.id)}
          onDragPoint={(point, done) => onDragPoint(item.id, point, done)}
          onClose={() => onClose(item.id)}
          closeLabel={ARENA_SHEET_WINDOW_TEXTS.close(item.name)}
          actions={
            <>
              <button
                type="button"
                onClick={() => onDockLeft(item.id)}
                aria-label={ARENA_DOCK_TEXTS.dockLeft(item.name)}
                title={ARENA_DOCK_TEXTS.dockLeft(item.name)}
                className={ARENA_WINDOW_ICON_BUTTON}
              >
                <Icon name="panel-left-open" size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDockRight(item.id)}
                aria-label={ARENA_DOCK_TEXTS.dockRight(item.name)}
                title={ARENA_DOCK_TEXTS.dockRight(item.name)}
                className={ARENA_WINDOW_ICON_BUTTON}
              >
                <Icon name="panel-right-open" size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onPopout(item.id)}
                aria-label={ARENA_SHEET_WINDOW_TEXTS.popout(item.name)}
                title={ARENA_SHEET_WINDOW_TEXTS.popout(item.name)}
                className={ARENA_WINDOW_ICON_BUTTON}
              >
                <Icon name="picture-in-picture-2" size={17} aria-hidden="true" />
              </button>
            </>
          }
        >
          <SheetPage characterId={item.id} variant="panel" />
        </FloatingWindow>
      ))}
      {dropZone && <ArenaDockHint side={dropZone} width={dropWidth} />}
    </>
  );
}
