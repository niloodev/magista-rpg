import type { ISheetTrait } from "@magista/shared";

export interface TraitEntryProps {
  trait: ISheetTrait;
  onEdit: () => void;
  onDelete: () => void;
}
