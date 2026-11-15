import type { ConnectionStatus } from "@/modules/table/table.types";

export interface ArenaTopBarProps {
  sceneName: string | null;
  status: ConnectionStatus;
  latencyMs: number | null;
  memberCount: number;
  /** GM only: whether the scene on screen is the live one (and if any scene is live). */
  broadcast: { live: boolean; hasLive: boolean } | null;
  onGoLive: () => void;
  onBackToLive: () => void;
  onOpenProfile: () => void;
}
