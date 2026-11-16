import type { ISheetEntry, SheetState } from "./sheetSlice.types";

export const EMPTY_SHEET_ENTRY: ISheetEntry = {
  status: "idle",
  accountId: null,
  character: null,
  error: null,
  revision: 0,
  savedRevision: 0,
  saveStatus: "idle",
  saveError: null,
  baseResources: null,
  savingResources: null,
};

export const defaultSheetState: SheetState = { sheets: {} };
