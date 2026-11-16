import { mergeGmOnlyFields, type ICharacter, type ICharacterSheet } from "@magista/shared";

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
 * Takes the current health and sanity of the server when the draft did not touch them since the last server
 * version (damage or healing applied from the Arena), keeping the local edit otherwise.
 */
export function mergeRemoteResources(
  local: ICharacterSheet,
  remote: ICharacterSheet,
  base: ICharacterSheet["resources"] | null,
): ICharacterSheet {
  if (!base) return local;
  let merged = local;
  for (const key of ["health", "sanity"] as const) {
    const current = remote.resources[key].current;
    if (
      local.resources[key].current !== base[key].current ||
      local.resources[key].current === current
    )
      continue;
    if (merged === local) merged = structuredClone(local);
    merged.resources[key].current = current;
  }
  return merged;
}

/**
 * A server version of an open sheet: ignored when older than the one already here (a late answer), taken whole
 * when nothing is pending, otherwise only the GM-only fields, tags and base version are merged into the local
 * draft (the GM keeps the whole draft), plus the current health and sanity the draft did not touch.
 */
export function withRemoteCharacter(
  entry: ISheetEntry,
  character: ICharacter,
  viewerIsGm: boolean,
): ISheetEntry {
  const current = entry.character;
  if (current && character.updatedAt < current.updatedAt) return entry;
  const baseResources = character.sheet.resources;
  if (!current || entry.revision === entry.savedRevision)
    return { ...entry, status: "ready", error: null, character, baseResources };
  const sheet = viewerIsGm ? current.sheet : mergeGmOnlyFields(current.sheet, character.sheet);
  return {
    ...entry,
    status: "ready",
    error: null,
    baseResources,
    character: {
      ...current,
      sheet: mergeRemoteResources(sheet, character.sheet, entry.baseResources),
      features: character.features,
      updatedAt: character.updatedAt,
    },
  };
}

const namesCache = new WeakMap<Record<string, ISheetEntry>, Record<string, string | null>>();

/**
 * Names of the loaded sheets by character id (a stable selector input for `useShallow`). Computed once per
 * `sheets` object, so selectors running on every store change (token moves, pings) cost nothing.
 */
export function sheetNames(sheets: Record<string, ISheetEntry>): Record<string, string | null> {
  const cached = namesCache.get(sheets);
  if (cached) return cached;
  const names = Object.fromEntries(
    Object.entries(sheets).map(([id, entry]) => [id, entry.character?.name ?? null]),
  );
  namesCache.set(sheets, names);
  return names;
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
