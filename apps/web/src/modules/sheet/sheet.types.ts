import type { ICharacterSheet, IDerivedSheet, IRollKind } from "@magista/shared";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export type SheetMutator = (draft: ICharacterSheet) => void;

export type SheetEditor = (mutator: SheetMutator) => void;

export type RollHandler = (roll: IRollKind) => void;

export interface SheetSectionProps {
  sheet: ICharacterSheet;
  derived: IDerivedSheet;
  onEdit: SheetEditor;
  onRoll: RollHandler;
  isGm: boolean;
}

export type SheetTab = "geral" | "habilidades" | "inventario" | "tracos" | "rolagens";
