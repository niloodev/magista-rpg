import { ARENA_DOCK_TEXTS } from "@/modules/arena/arena.constants";
import type { IArenaDockedTabs } from "@/modules/arena/arena.types";
import { dockedIdOf, dockTabKey, withDockedTabs } from "@/modules/arena/arena.utils";

import { ARENA_ROLLS_TAB_KEY } from "./ArenaRollsPanel.constants";

/**
 * Tabs of the roll panel: "Rolagens" first, then the sheets docked in it.
 */
export function rollsPanelTabs(docked: IArenaDockedTabs) {
  return {
    items: withDockedTabs(
      [{ key: ARENA_ROLLS_TAB_KEY, label: ARENA_DOCK_TEXTS.rollsTab, icon: "dices" }],
      docked.sheets,
    ),
    active: docked.active ? dockTabKey(docked.active) : ARENA_ROLLS_TAB_KEY,
    onChange: (key: string) => docked.onShow(dockedIdOf(key)),
  };
}
