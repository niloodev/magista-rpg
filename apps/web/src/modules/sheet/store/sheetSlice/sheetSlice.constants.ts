import type { SheetState } from "./sheetSlice.types";

export const defaultSheetState: SheetState = {
  sheet: {
    status: "idle",
    requestedId: null,
    character: null,
    error: null,
    revision: 0,
    savedRevision: 0,
    saveStatus: "idle",
    saveError: null,
  },
};
