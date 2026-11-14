import type { ISheetTrait } from "@magista/shared";

export interface TraitEntryProps {
  trait: ISheetTrait;
  pinged: boolean;
  onPing: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
