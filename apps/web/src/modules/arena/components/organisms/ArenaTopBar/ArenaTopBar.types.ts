import type { ConnectionStatus } from "@/modules/table/table.types";

export interface ArenaTopBarProps {
  sceneName: string | null;
  status: ConnectionStatus;
  memberCount: number;
  onOpenProfile: () => void;
}
