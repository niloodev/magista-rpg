import { mergeGmOnlyFields, type ICharacter } from "@magista/shared";

import type { ISheetEntry, SheetState } from "./sheetSlice.types";

/**
 * Applies a change to one open sheet, leaving the state untouched when that sheet is not open (an answer for a
 * sheet that was never requested, or a character loaded under another id).
 */
export function updateEntry(
  state: SheetState,
  characterId: string,
  change: (entry: ISheetEntry) => ISheetEntry | null,
): SheetState | Partial<SheetState> {
  const entry = state.sheets[characterId];
  if (!entry) return state;
  const next = change(entry);
  return next ? { sheets: { ...state.sheets, [characterId]: next } } : state;
}

/**
 * A server version of an open sheet: ignored when older than the one already here (a late answer), taken whole
 * when nothing is pending, otherwise only the GM-only fields, tags and base version are merged into the local
 * draft (the GM keeps the whole draft).
 */
export function withRemoteCharacter(
  entry: ISheetEntry,
  character: ICharacter,
  viewerIsGm: boolean,
): ISheetEntry {
  const current = entry.character;
  if (current && character.updatedAt < current.updatedAt) return entry;
  if (!current || entry.revision === entry.savedRevision)
    return { ...entry, status: "ready", error: null, character };
  return {
    ...entry,
    status: "ready",
    error: null,
    character: {
      ...current,
      sheet: viewerIsGm ? current.sheet : mergeGmOnlyFields(current.sheet, character.sheet),
      features: character.features,
      updatedAt: character.updatedAt,
    },
  };
}

/**
 * Names of the loaded sheets by character id (a stable selector input for `useShallow`).
 */
export function sheetNames(sheets: Record<string, ISheetEntry>): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(sheets).map(([id, entry]) => [id, entry.character?.name ?? null]),
  );
}

/**
 * True when an open sheet has edits that are not saved yet (pending, saving or failed), so reopening it must
 * keep the draft instead of starting over.
 */
export function hasUnsavedWork(entry: ISheetEntry | undefined): boolean {
  if (!entry?.character) return false;
  return (
    entry.revision !== entry.savedRevision ||
    entry.saveStatus === "saving" ||
    entry.saveStatus === "error"
  );
}
