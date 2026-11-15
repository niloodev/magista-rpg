"use client";

import {
  ARENA_PANEL_TOGGLE_POSITION,
  ARENA_ROLLS_PANEL_ID,
  ARENA_ROLLS_TEXTS,
  ARENA_ROLLS_WIDTH,
} from "@/modules/arena/arena.constants";
import { RollFeed } from "@/modules/table/components/organisms";
import { ResizeHandle, TabPanel, Tabs } from "@/shared/components/molecules";

import { ArenaPanelToggle, DockedTabPanels } from "../../molecules";
import {
  ARENA_ROLLS_PANEL_CLASSES,
  ARENA_ROLLS_TAB_KEY,
  ARENA_ROLLS_TABS_PREFIX,
} from "./ArenaRollsPanel.constants";
import type { ArenaRollsPanelProps } from "./ArenaRollsPanel.types";
import { rollsPanelTabs } from "./ArenaRollsPanel.utils";

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
  docked,
}: ArenaRollsPanelProps) {
  const tabs = rollsPanelTabs(docked);
  const feed = (
    <RollFeed
      rolls={rolls}
      pending={pending}
      loading={loading}
      className="h-full min-w-0 flex-1 border-0 bg-transparent"
      emptyHint={ARENA_ROLLS_TEXTS.emptyHint}
      headless
    />
  );
  return (
    <>
      {open && (
        <aside
          id={ARENA_ROLLS_PANEL_ID}
          aria-label={ARENA_ROLLS_TEXTS.label}
          className={ARENA_ROLLS_PANEL_CLASSES}
          style={{ width }}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <Tabs
              items={tabs.items}
              active={tabs.active}
              onChange={tabs.onChange}
              label={ARENA_ROLLS_TEXTS.tabs}
              idPrefix={ARENA_ROLLS_TABS_PREFIX}
              dense
            />
            <TabPanel
              idPrefix={ARENA_ROLLS_TABS_PREFIX}
              tabKey={ARENA_ROLLS_TAB_KEY}
              active={!docked.active}
              className="flex min-h-0 flex-1"
            >
              {feed}
            </TabPanel>
            <DockedTabPanels idPrefix={ARENA_ROLLS_TABS_PREFIX} docked={docked} />
          </div>
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
