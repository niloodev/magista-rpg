import type { IAccount, IMoveLibraryItemInput } from "@magista/shared";

import type { ILibraryData } from "@/modules/library/library.types";
import type { LoadStatus } from "@/shared/types";

export interface LibraryState {
  library: ILibraryData & {
    status: LoadStatus;
    error: string | null;
    accounts: IAccount[];
    expandedFolderIds: string[];
    query: string;
  };
}

export interface LibraryActions {
  startLibraryLoad: () => void;
  finishLibraryLoad: (data: ILibraryData & { accounts: IAccount[] }) => void;
  failLibraryLoad: (error: string) => void;
  toggleLibraryFolder: (folderId: string) => void;
  expandLibraryFolders: (folderIds: string[]) => void;
  setExpandedLibraryFolders: (folderIds: string[]) => void;
  setLibraryQuery: (query: string) => void;
  applyLibraryMove: (move: IMoveLibraryItemInput) => ILibraryData;
  restoreLibraryData: (data: ILibraryData) => void;
}

export type LibrarySlice = LibraryState & LibraryActions;
