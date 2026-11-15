import type { ArenaSidebarTab, IArenaDockedTabs } from "@/modules/arena/arena.types";
import { dockedIdOf, dockTabKey, withDockedTabs } from "@/modules/arena/arena.utils";

import { ARENA_SIDEBAR_TABS } from "./ArenaSidebar.constants";

/**
 * Tabs of the sidebar (Fichas, Mapas for the GM, then the docked sheets), the shown one and the change handler
 * that tells a docked sheet from the sidebar's own tabs.
 */
export function sidebarTabs({
  showScenes,
  tab,
  docked,
  onTabChange,
}: {
  showScenes: boolean;
  tab: ArenaSidebarTab;
  docked: IArenaDockedTabs;
  onTabChange: (tab: ArenaSidebarTab) => void;
}) {
  const own = showScenes
    ? ARENA_SIDEBAR_TABS
    : ARENA_SIDEBAR_TABS.filter((item) => item.key !== "scenes");
  return {
    items: withDockedTabs(own, docked.sheets),
    active: docked.active ? dockTabKey(docked.active) : tab,
    onChange: (key: string) => {
      const sheetId = dockedIdOf(key);
      docked.onShow(sheetId);
      if (!sheetId) onTabChange(key as ArenaSidebarTab);
    },
  };
}
