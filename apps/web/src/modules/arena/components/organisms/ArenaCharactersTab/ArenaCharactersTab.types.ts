import type { ICharacterSummary } from "@magista/shared";

export interface ArenaCharactersTabProps {
  isGm: boolean;
  /** A scene is open, so the GM can put tokens on it. */
  canPlace: boolean;
  onOpenCharacter: (characterId: string) => void;
  onPlaceCharacter: (character: ICharacterSummary) => void;
  onDropCharacter: (character: ICharacterSummary, point: { x: number; y: number }) => void;
  onNewNpc: () => void;
}
