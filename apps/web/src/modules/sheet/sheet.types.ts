import type { ICharacterSheet, IDerivedSheet, IPingEntry, IRollKind } from "@magista/shared";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export type SheetMutator = (draft: ICharacterSheet) => void;

export type SheetEditor = (mutator: SheetMutator) => void;

export type RollHandler = (roll: IRollKind) => void;

export type PingHandler = (entry: IPingEntry) => void;

export interface SheetSectionProps {
  sheet: ICharacterSheet;
  derived: IDerivedSheet;
  onEdit: SheetEditor;
  onRoll: RollHandler;
  onPing: PingHandler;
  pingedId: string | null;
  isGm: boolean;
}

export type SheetTab = "geral" | "habilidades" | "inventario" | "tracos" | "rolagens";

/** "page" is the full route; "window" is the popout (no page chrome), opened beside the table or, later, the Arena. */
export type SheetVariant = "page" | "window";
