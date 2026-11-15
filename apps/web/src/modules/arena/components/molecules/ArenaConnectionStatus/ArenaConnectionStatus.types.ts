import type { ConnectionStatus } from "@/modules/table/table.types";

export interface ArenaConnectionStatusProps {
  status: ConnectionStatus;
  /** Round trip in ms, shown next to the label (null while unknown). */
  latencyMs?: number | null;
}
