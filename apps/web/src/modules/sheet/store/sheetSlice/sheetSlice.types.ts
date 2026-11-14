import type { ICharacter } from "@magista/shared";

import type { SaveStatus, SheetMutator } from "@/modules/sheet/sheet.types";
import type { LoadStatus } from "@/shared/types";

export interface SheetState {
  sheet: {
    status: LoadStatus;
    requestedId: string | null;
    character: ICharacter | null;
    error: string | null;
    revision: number;
    savedRevision: number;
    saveStatus: SaveStatus;
    saveError: string | null;
  };
}

export interface SheetActions {
  startSheetLoad: (characterId: string) => void;
  finishSheetLoad: (character: ICharacter) => void;
  failSheetLoad: (characterId: string, error: string) => void;
  editSheet: (mutator: SheetMutator) => void;
  markSheetSaving: () => void;
  markSheetSaved: (characterId: string, revision: number, updatedAt: string) => void;
  markSheetSaveFailed: (characterId: string, error: string) => void;
  applyRemoteCharacter: (character: ICharacter) => void;
  replaceCharacter: (character: ICharacter) => void;
}

export type SheetSlice = SheetState & SheetActions;
