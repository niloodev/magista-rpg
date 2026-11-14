import type { StateCreator } from "zustand";

import { applyMove } from "@/modules/library/library.utils";
import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultLibraryState } from "./librarySlice.constants";
import type { LibrarySlice } from "./librarySlice.types";

export const createLibrarySlice: StateCreator<AppStore, [], [], LibrarySlice> = (set, get) => ({
  ...defaultLibraryState,
  startLibraryLoad: () =>
    set((state) => ({
      library: {
        ...state.library,
        status: state.library.status === "ready" ? "ready" : "loading",
        error: null,
      },
    })),
  finishLibraryLoad: ({ characters, folders, accounts }) =>
    set((state) => ({
      library: {
        ...state.library,
        status: "ready",
        error: null,
        characters,
        folders,
        accounts,
        expandedFolderIds: state.library.expandedFolderIds.filter((id) =>
          folders.some((folder) => folder.id === id),
        ),
      },
    })),
  failLibraryLoad: (error) =>
    set((state) => ({ library: { ...state.library, status: "error", error } })),
  toggleLibraryFolder: (folderId) =>
    set((state) => {
      const open = state.library.expandedFolderIds.includes(folderId);
      return {
        library: {
          ...state.library,
          expandedFolderIds: open
            ? state.library.expandedFolderIds.filter((id) => id !== folderId)
            : [...state.library.expandedFolderIds, folderId],
        },
      };
    }),
  expandLibraryFolders: (folderIds) =>
    set((state) => ({
      library: {
        ...state.library,
        expandedFolderIds: [...new Set([...state.library.expandedFolderIds, ...folderIds])],
      },
    })),
  setExpandedLibraryFolders: (expandedFolderIds) =>
    set((state) => ({ library: { ...state.library, expandedFolderIds } })),
  setLibraryQuery: (query) => set((state) => ({ library: { ...state.library, query } })),
  applyLibraryMove: (move) => {
    const { characters, folders } = get().library;
    const next = applyMove({ characters, folders }, move);
    set((state) => ({ library: { ...state.library, ...next } }));
    return { characters, folders };
  },
  restoreLibraryData: ({ characters, folders }) =>
    set((state) => ({ library: { ...state.library, characters, folders } })),
});
