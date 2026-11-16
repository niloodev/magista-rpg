import type {
  ICharacterSheet,
  ICharacter,
  ICharacterFeaturesEvent,
  ICharacterImages,
} from "@magista/shared";

import type { SaveStatus, SheetMutator } from "@/modules/sheet/sheet.types";
import type { LoadStatus } from "@/shared/types";

/** One open sheet: its load state, the local draft and its autosave state. */
export interface ISheetEntry {
  status: LoadStatus;
  /** Account that opened it: a draft never survives into another account's session in the same tab. */
  accountId: string | null;
  character: ICharacter | null;
  error: string | null;
  revision: number;
  savedRevision: number;
  saveStatus: SaveStatus;
  saveError: string | null;
  /** Health and sanity of the last server version known here (to tell a remote change from a local edit). */
  baseResources: ICharacterSheet["resources"] | null;
  /** Health and sanity of the save in flight (they become the base once it is stored). */
  savingResources: ICharacterSheet["resources"] | null;
}

export interface SheetState {
  /** Sheets open in this tab (the sheet page, a popout or the Arena floating windows), by character id. */
  sheets: Record<string, ISheetEntry>;
}

export interface SheetActions {
  startSheetLoad: (characterId: string) => void;
  finishSheetLoad: (character: ICharacter) => void;
  failSheetLoad: (characterId: string, error: string) => void;
  editSheet: (characterId: string, mutator: SheetMutator) => void;
  markSheetSaving: (characterId: string) => void;
  markSheetSaved: (characterId: string, revision: number, updatedAt: string) => void;
  markSheetSaveFailed: (characterId: string, error: string) => void;
  applyRemoteCharacter: (character: ICharacter) => void;
  replaceCharacter: (character: ICharacter) => void;
  applySheetImages: (images: ICharacterImages) => void;
  applySheetFeatures: (event: ICharacterFeaturesEvent) => void;
}

export type SheetSlice = SheetState & SheetActions;
