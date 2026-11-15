"use client";

import {
  ARENA_PANEL_TOGGLE_POSITION,
  ARENA_ROLLS_PANEL_ID,
  ARENA_ROLLS_TEXTS,
  ARENA_ROLLS_WIDTH,
} from "@/modules/arena/arena.constants";
import { RollFeed } from "@/modules/table/components/organisms";
import { ResizeHandle } from "@/shared/components/molecules";

import { ArenaPanelToggle } from "../../molecules";
import { ARENA_ROLLS_PANEL_CLASSES } from "./ArenaRollsPanel.constants";
import type { ArenaRollsPanelProps } from "./ArenaRollsPanel.types";

/**
 * The table roll feed, always at hand on the left of the Arena (it is where the table lives). The tab on its
 * edge hides it and stays on the screen edge to bring it back (one element, so the focus is kept).
 */
export function ArenaRollsPanel({
  open,
  rolls,
  pending,
  loading,
  onOpenChange,
  width,
  onResize,
  onResizeCommit,
}: ArenaRollsPanelProps) {
  return (
    <>
      {open && (
        <aside
          id={ARENA_ROLLS_PANEL_ID}
          aria-label={ARENA_ROLLS_TEXTS.label}
          className={ARENA_ROLLS_PANEL_CLASSES}
          style={{ width }}
        >
          <RollFeed
            rolls={rolls}
            pending={pending}
            loading={loading}
            className="h-full min-w-0 flex-1 border-0 bg-transparent"
            emptyHint={ARENA_ROLLS_TEXTS.emptyHint}
          />
          <ResizeHandle
            label={ARENA_ROLLS_TEXTS.resize}
            value={width}
            min={ARENA_ROLLS_WIDTH.min}
            max={ARENA_ROLLS_WIDTH.max}
            direction={1}
            onChange={onResize}
            onCommit={onResizeCommit}
            className="-right-1"
          />
        </aside>
      )}
      <ArenaPanelToggle
        side="left"
        open={open}
        controls={ARENA_ROLLS_PANEL_ID}
        label={open ? ARENA_ROLLS_TEXTS.close : ARENA_ROLLS_TEXTS.open}
        onToggle={() => onOpenChange(!open)}
        className={ARENA_PANEL_TOGGLE_POSITION}
        style={{ left: open ? width : 0 }}
      />
    </>
  );
}
