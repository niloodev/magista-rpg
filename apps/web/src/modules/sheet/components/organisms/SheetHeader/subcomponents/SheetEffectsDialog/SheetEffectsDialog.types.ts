import type { ArenaChangeKind, ArenaResourceKey, ISheetEffects } from "@magista/shared";

export interface SheetEffectsDialogProps {
  characterName: string;
  effects: ISheetEffects;
  /** Saves the chosen animations into the sheet draft (the autosave sends them). */
  onSave: (effects: ISheetEffects) => void;
  onClose: () => void;
}

export interface ISheetEffectSlot {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  label: string;
}
