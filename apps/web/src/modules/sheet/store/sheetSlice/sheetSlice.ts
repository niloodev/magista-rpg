import type { StateCreator } from "zustand";

import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultSheetState, EMPTY_SHEET_ENTRY } from "./sheetSlice.constants";
import type { SheetSlice } from "./sheetSlice.types";
import { hasUnsavedWork, updateEntry, withRemoteCharacter } from "./sheetSlice.utils";

export const createSheetSlice: StateCreator<AppStore, [], [], SheetSlice> = (set) => ({
  ...defaultSheetState,
  startSheetLoad: (characterId) =>
    set((state) => {
      const accountId = state.session.data?.account.id ?? null;
      const entry = state.sheets[characterId];
      if (entry && entry.accountId === accountId && hasUnsavedWork(entry)) return state;
      return {
        sheets: {
          ...state.sheets,
          [characterId]: { ...EMPTY_SHEET_ENTRY, status: "loading", accountId },
        },
      };
    }),
  finishSheetLoad: (character) =>
    set((state) => {
      const viewerIsGm = state.session.data?.account.role === "GM";
      return updateEntry(state, character.id, (entry) =>
        entry.character
          ? withRemoteCharacter(entry, character, viewerIsGm)
          : {
              ...EMPTY_SHEET_ENTRY,
              status: "ready",
              accountId: entry.accountId,
              character,
              baseResources: character.sheet.resources,
            },
      );
    }),
  failSheetLoad: (characterId, error) =>
    set((state) =>
      updateEntry(state, characterId, (entry) =>
        hasUnsavedWork(entry) && entry.accountId === (state.session.data?.account.id ?? null)
          ? { ...entry, error }
          : { ...EMPTY_SHEET_ENTRY, status: "error", accountId: entry.accountId, error },
      ),
    ),
  editSheet: (characterId, mutator) =>
    set((state) =>
      updateEntry(state, characterId, (entry) => {
        if (!entry.character) return null;
        const draft = structuredClone(entry.character.sheet);
        mutator(draft);
        return {
          ...entry,
          character: { ...entry.character, sheet: draft },
          revision: entry.revision + 1,
          saveStatus: "pending",
        };
      }),
    ),
  markSheetSaving: (characterId) =>
    set((state) =>
      updateEntry(state, characterId, (entry) => ({
        ...entry,
        saveStatus: "saving",
        savingResources: entry.character?.sheet.resources ?? null,
      })),
    ),
  markSheetSaved: (characterId, revision, updatedAt) =>
    set((state) =>
      updateEntry(state, characterId, (entry) =>
        entry.character
          ? {
              ...entry,
              character: { ...entry.character, updatedAt },
              savedRevision: revision,
              saveStatus: revision === entry.revision ? "saved" : "pending",
              saveError: null,
              baseResources: entry.savingResources ?? entry.baseResources,
              savingResources: null,
            }
          : null,
      ),
    ),
  markSheetSaveFailed: (characterId, error) =>
    set((state) =>
      updateEntry(state, characterId, (entry) =>
        entry.character ? { ...entry, saveStatus: "error", saveError: error } : null,
      ),
    ),
  replaceCharacter: (character) =>
    set((state) =>
      updateEntry(state, character.id, (entry) => ({
        ...entry,
        character,
        savedRevision: entry.revision,
        saveStatus: "saved",
        saveError: null,
        baseResources: character.sheet.resources,
      })),
    ),
  applySheetImages: ({ id, ...images }) =>
    set((state) =>
      updateEntry(state, id, (entry) =>
        entry.character ? { ...entry, character: { ...entry.character, ...images } } : null,
      ),
    ),
  applySheetFeatures: ({ id, features }) =>
    set((state) =>
      updateEntry(state, id, (entry) =>
        entry.character ? { ...entry, character: { ...entry.character, features } } : null,
      ),
    ),
  applyRemoteCharacter: (character) =>
    set((state) => {
      const viewerIsGm = state.session.data?.account.role === "GM";
      return updateEntry(state, character.id, (entry) =>
        entry.character ? withRemoteCharacter(entry, character, viewerIsGm) : null,
      );
    }),
});
