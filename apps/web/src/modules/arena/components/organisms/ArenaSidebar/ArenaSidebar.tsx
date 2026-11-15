"use client";

import {
  ARENA_PANEL_TOGGLE_POSITION,
  ARENA_SIDEBAR_PANEL_ID,
  ARENA_SIDEBAR_TEXTS,
  ARENA_SIDEBAR_WIDTH,
} from "@/modules/arena/arena.constants";
import { ResizeHandle, TabPanel, Tabs } from "@/shared/components/molecules";

import { ARENA_SIDEBAR_CLASSES, ARENA_SIDEBAR_ID_PREFIX } from "./ArenaSidebar.constants";
import { ArenaPanelToggle, DockedTabPanels } from "../../molecules";
import type { ArenaSidebarProps } from "./ArenaSidebar.types";
import { sidebarTabs } from "./ArenaSidebar.utils";

/**
 * Right sidebar of the Arena, like the Roll20 one: sheets and, for the GM, the scene library, in tabs.
 * The tab on its edge hides it so the map can take the whole screen.
 */
export function ArenaSidebar({
  open,
  tab,
  showScenes,
  onTabChange,
  onOpenChange,
  characters,
  scenes,
  width,
  onResize,
  onResizeCommit,
  docked,
}: ArenaSidebarProps) {
  const { items, active, onChange } = sidebarTabs({ showScenes, tab, docked, onTabChange });
  return (
    <>
      <ArenaPanelToggle
        side="right"
        open={open}
        controls={ARENA_SIDEBAR_PANEL_ID}
        label={open ? ARENA_SIDEBAR_TEXTS.close : ARENA_SIDEBAR_TEXTS.open}
        onToggle={() => onOpenChange(!open)}
        className={ARENA_PANEL_TOGGLE_POSITION}
        style={{ right: open ? width : 0 }}
      />
      {open && (
        <aside
          id={ARENA_SIDEBAR_PANEL_ID}
          aria-label={ARENA_SIDEBAR_TEXTS.label}
          className={ARENA_SIDEBAR_CLASSES}
          style={{ width }}
        >
          <ResizeHandle
            label={ARENA_SIDEBAR_TEXTS.resize}
            value={width}
            min={ARENA_SIDEBAR_WIDTH.min}
            max={ARENA_SIDEBAR_WIDTH.max}
            direction={-1}
            onChange={onResize}
            onCommit={onResizeCommit}
            className="-left-1"
          />
          <div className="flex items-stretch">
            <div className="min-w-0 flex-1">
              <Tabs
                items={items}
                active={active}
                onChange={onChange}
                label={ARENA_SIDEBAR_TEXTS.tabs}
                idPrefix={ARENA_SIDEBAR_ID_PREFIX}
                dense
              />
            </div>
          </div>
          <TabPanel
            idPrefix={ARENA_SIDEBAR_ID_PREFIX}
            tabKey="characters"
            active={!docked.active && tab === "characters"}
            className="min-h-0 flex-1 overflow-y-auto p-4"
          >
            <h2 className="sr-only">{ARENA_SIDEBAR_TEXTS.characters}</h2>
            {characters}
          </TabPanel>
          {showScenes && (
            <TabPanel
              idPrefix={ARENA_SIDEBAR_ID_PREFIX}
              tabKey="scenes"
              active={!docked.active && tab === "scenes"}
              className="min-h-0 flex-1 overflow-y-auto p-4"
            >
              <h2 className="sr-only">{ARENA_SIDEBAR_TEXTS.scenes}</h2>
              {scenes}
            </TabPanel>
          )}
          <DockedTabPanels idPrefix={ARENA_SIDEBAR_ID_PREFIX} docked={docked} />
        </aside>
      )}
    </>
  );
}
