import type { ConnectionStatus } from "@/modules/table/table.types";

export interface ArenaTopBarProps {
  sceneName: string | null;
  status: ConnectionStatus;
  memberCount: number;
  /** GM only: whether the scene on screen is the live one (and if any scene is live). */
  broadcast: { live: boolean; hasLive: boolean } | null;
  onGoLive: () => void;
  onBackToLive: () => void;
  onOpenProfile: () => void;
  /** The "Turnos" button (null without a scene): whether the window is open and if it is the viewer's turn. */
  turns: { open: boolean; yourTurn: boolean; onToggle: () => void } | null;
}
