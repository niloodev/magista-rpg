import { mergeGmOnlyFields } from "@magista/shared";
import type { StateCreator } from "zustand";

import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultSheetState } from "./sheetSlice.constants";
import { isStaleLoad } from "./sheetSlice.utils";
import type { SheetSlice } from "./sheetSlice.types";

export const createSheetSlice: StateCreator<AppStore, [], [], SheetSlice> = (set) => ({
  ...defaultSheetState,
  startSheetLoad: (characterId) =>
    set({ sheet: { ...defaultSheetState.sheet, status: "loading", requestedId: characterId } }),
  finishSheetLoad: (character) =>
    set((state) =>
      isStaleLoad(state.sheet.requestedId, character.id)
        ? state
        : {
            sheet: {
              ...defaultSheetState.sheet,
              status: "ready",
              requestedId: character.id,
              character,
            },
          },
    ),
  failSheetLoad: (characterId, error) =>
    set((state) =>
      isStaleLoad(state.sheet.requestedId, characterId)
        ? state
        : {
            sheet: {
              ...defaultSheetState.sheet,
              status: "error",
              requestedId: characterId,
              error,
            },
          },
    ),
  editSheet: (mutator) =>
    set((state) => {
      const { character } = state.sheet;
      if (!character) return state;
      const draft = structuredClone(character.sheet);
      mutator(draft);
      return {
        sheet: {
          ...state.sheet,
          character: { ...character, sheet: draft },
          revision: state.sheet.revision + 1,
          saveStatus: "pending",
        },
      };
    }),
  markSheetSaving: () => set((state) => ({ sheet: { ...state.sheet, saveStatus: "saving" } })),
  markSheetSaved: (characterId, revision, updatedAt) =>
    set((state) => {
      const { character } = state.sheet;
      if (!character || character.id !== characterId) return state;
      return {
        sheet: {
          ...state.sheet,
          character: { ...character, updatedAt },
          savedRevision: revision,
          saveStatus: revision === state.sheet.revision ? "saved" : "pending",
          saveError: null,
        },
      };
    }),
  markSheetSaveFailed: (characterId, error) =>
    set((state) =>
      state.sheet.character?.id === characterId
        ? { sheet: { ...state.sheet, saveStatus: "error", saveError: error } }
        : state,
    ),
  replaceCharacter: (character) =>
    set((state) => ({
      sheet: {
        ...state.sheet,
        character,
        savedRevision: state.sheet.revision,
        saveStatus: "saved",
        saveError: null,
      },
    })),
  applyRemoteCharacter: (character) =>
    set((state) => {
      const current = state.sheet.character;
      if (!current || current.id !== character.id) return state;
      if (state.sheet.revision === state.sheet.savedRevision) {
        return { sheet: { ...state.sheet, character } };
      }
      const viewerIsGm = state.session.data?.account.role === "GM";
      return {
        sheet: {
          ...state.sheet,
          character: {
            ...current,
            sheet: viewerIsGm ? current.sheet : mergeGmOnlyFields(current.sheet, character.sheet),
            updatedAt: character.updatedAt,
          },
        },
      };
    }),
});
