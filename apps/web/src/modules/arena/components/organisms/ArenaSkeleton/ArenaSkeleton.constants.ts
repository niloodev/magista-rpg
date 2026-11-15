import { ARENA_DOCK_TEXTS } from "@/modules/arena/arena.constants";
import type { TabItem } from "@/shared/components/molecules";

export const ARENA_SKELETON_TABS_PREFIX = "arena-sidebar-skeleton";

export const HUD_GAP = 16;

export const ARENA_SKELETON_ROLLS_PREFIX = "arena-rolls-skeleton";

export const ARENA_SKELETON_ROLLS_TABS: TabItem<string>[] = [
  { key: "rolls", label: ARENA_DOCK_TEXTS.rollsTab, icon: "dices" },
];
