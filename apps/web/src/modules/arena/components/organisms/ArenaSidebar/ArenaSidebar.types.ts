import type { ReactNode } from "react";

import type { ArenaSidebarTab } from "@/modules/arena/arena.types";

export interface ArenaSidebarProps {
  open: boolean;
  tab: ArenaSidebarTab;
  showScenes: boolean;
  onTabChange: (tab: ArenaSidebarTab) => void;
  onOpenChange: (open: boolean) => void;
  characters: ReactNode;
  scenes: ReactNode;
  width: number;
  onResize: (width: number) => void;
  onResizeCommit: (width: number) => void;
}
