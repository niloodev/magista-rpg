export interface ArenaDockedSheetProps {
  characterId: string;
  name: string | null;
  onUndock: () => void;
  onClose: () => void;
}
