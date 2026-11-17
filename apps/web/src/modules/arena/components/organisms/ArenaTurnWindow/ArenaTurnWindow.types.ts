import type { IArenaTurnRow } from "@/modules/arena/arena.types";

export interface ArenaTurnWindowProps {
  isGm: boolean;
  rows: IArenaTurnRow[];
  round: number;
  /** Name of the token whose turn it is (as the viewer may read it), or null. */
  currentName: string | null;
  /** Someone holds the turn (the GM's "Próximo" reads "Começar" before that). */
  started: boolean;
  /** The current turn is one of the viewer's tokens (a player may end it). */
  yourTurn: boolean;
  /** Widths of the open side panels when the window opens, for its default spot (top right of the map area). */
  initialPanels: () => { left: number; right: number };
  onNext: () => void;
  onPrevious: () => void;
  onEndTurn: () => void;
  onSort: () => void;
  onRequestClear: () => void;
  onSetInitiative: (tokenId: string, initiative: number | null) => void;
  onMove: (activeId: string, overId: string) => void;
  onRemove: (tokenId: string) => void;
  onFocus: (tokenId: string) => void;
  onPick: (tokenId: string) => void;
  onClose: () => void;
}
