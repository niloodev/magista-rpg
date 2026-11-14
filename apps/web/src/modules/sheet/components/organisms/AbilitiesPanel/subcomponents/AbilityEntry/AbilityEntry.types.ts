import type { IDerivedAbility, ISheetAbility } from "@magista/shared";

export interface AbilityEntryProps {
  ability: ISheetAbility;
  derived: IDerivedAbility | undefined;
  onRoll: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
