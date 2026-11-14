import type { ICharacterSheet } from "@magista/shared";

export interface LevelUpModalProps {
  open: boolean;
  sheet: ICharacterSheet;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (addToCurrent: boolean) => void;
}
