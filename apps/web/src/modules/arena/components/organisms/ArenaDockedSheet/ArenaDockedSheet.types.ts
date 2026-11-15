export interface ArenaDockedSheetProps {
  characterId: string;
  name: string | null;
  onUndock: (characterId: string) => void;
  onClose: (characterId: string) => void;
}
