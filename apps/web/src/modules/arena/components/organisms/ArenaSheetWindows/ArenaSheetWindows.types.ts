import type { ArenaDockSide } from "@/modules/arena/arena.types";

export interface ArenaSheetWindowsProps {
  /** Widths of the open side panels (0 when closed): new windows open next to the left one, and a window
   * dragged onto either docks there. */
  panels: { left: number; right: number };
  onDock: (characterId: string, side: ArenaDockSide) => void;
}

export interface IArenaSheetWindow {
  id: string;
  title: string;
  name: string | null;
  slot: number;
  zIndex: number;
}
