import type { ControllerResult, ICharacter, ICharacterSheet } from "@magista/shared";

import type { SheetVariant } from "@/modules/sheet/sheet.types";

export interface SheetPageProps {
  characterId: string;
  variant?: SheetVariant;
}

export type SaveAttemptOutcome = "done" | "conflict";

export interface SheetSaveSnapshot {
  character: ICharacter | null;
  revision: number;
  savedRevision: number;
}

export interface SheetSaveDeps {
  read: () => SheetSaveSnapshot;
  save: (
    id: string,
    sheet: ICharacterSheet,
    baseUpdatedAt: string,
  ) => Promise<ControllerResult<ICharacter>>;
  fetchLatest: (id: string) => Promise<ControllerResult<ICharacter>>;
  markSaving: () => void;
  markSaved: (characterId: string, revision: number, updatedAt: string) => void;
  markFailed: (characterId: string, error: string) => void;
  applyRemote: (character: ICharacter) => void;
}
