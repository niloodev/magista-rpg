import type { IArenaTurnRow } from "@/modules/arena/arena.types";

export interface ArenaTurnRowProps {
  row: IArenaTurnRow;
  isGm: boolean;
  onPick: (tokenId: string) => void;
  onSetInitiative: (tokenId: string, initiative: number | null) => void;
  onFocus: (tokenId: string) => void;
  onRemove: (tokenId: string) => void;
}
