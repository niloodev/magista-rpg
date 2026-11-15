import type { IRollPending, IRollResult } from "@magista/shared";

export interface ArenaRollsPanelProps {
  open: boolean;
  rolls: IRollResult[];
  pending: IRollPending[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  onResize: (width: number) => void;
  onResizeCommit: (width: number) => void;
}
