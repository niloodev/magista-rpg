import { ARENA_SIDEBAR_TEXTS } from "@/modules/arena/arena.constants";
import type { ArenaSidebarTab } from "@/modules/arena/arena.types";
import type { TabItem } from "@/shared/components/molecules";

export const ARENA_SIDEBAR_ID_PREFIX = "arena-sidebar";

export const ARENA_SIDEBAR_TABS: TabItem<ArenaSidebarTab>[] = [
  {
    key: "characters",
    label: ARENA_SIDEBAR_TEXTS.characters,
    icon: "scroll-text",
  },
  { key: "scenes", label: ARENA_SIDEBAR_TEXTS.scenes, icon: "map" },
];

export const ARENA_SIDEBAR_CLASSES =
  "absolute top-14 right-0 bottom-0 z-20 flex flex-col border-l border-border bg-black/75 backdrop-blur-sm lite:bg-void-900/95 lite:backdrop-blur-none";
