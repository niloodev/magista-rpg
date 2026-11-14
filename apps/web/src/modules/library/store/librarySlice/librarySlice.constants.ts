import type { LibraryState } from "./librarySlice.types";

export const defaultLibraryState: LibraryState = {
  library: {
    status: "idle",
    error: null,
    characters: [],
    folders: [],
    accounts: [],
    expandedFolderIds: [],
    query: "",
  },
};
