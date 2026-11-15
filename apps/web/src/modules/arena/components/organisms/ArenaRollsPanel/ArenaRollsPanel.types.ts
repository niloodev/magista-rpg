import type { IRollPending, IRollResult } from "@magista/shared";

import type { IArenaDockedTabs } from "@/modules/arena/arena.types";

export interface ArenaRollsPanelProps {
  open: boolean;
  rolls: IRollResult[];
  pending: IRollPending[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  onResize: (width: number) => void;
  onResizeCommit: (width: number) => void;
  docked: IArenaDockedTabs;
}
