import type {
  IArenaDragEvent,
  IArenaFolder,
  IArenaLibrary,
  IArenaScene,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
  IArenaTokenPatch,
  IMoveArenaTokenInput,
} from "@magista/shared";

import type { IArenaPoint } from "@magista/shared";
import type { ArenaSelectionMode } from "@/modules/arena/arena.types";
import type { ITreeMove } from "@/modules/library/library.types";
import type { LoadStatus } from "@/shared/types";

export interface ArenaState {
  arena: {
    status: LoadStatus;
    view: IArenaView | null;
    error: string | null;
    selectedTokenIds: string[];
    /** Live drag positions from other tabs, by token id (cleared when the final move arrives). */
    previews: Record<string, IArenaPoint>;
    /** Scene the GM is previewing (null follows the live scene). */
    viewSceneId: string | null;
    library: {
      status: LoadStatus;
      scenes: IArenaScene[];
      folders: IArenaFolder[];
      error: string | null;
    };
    expandedFolderIds: string[];
  };
}

export interface ArenaActions {
  startArenaLoad: () => void;
  finishArenaLoad: (view: IArenaView) => void;
  failArenaLoad: (error: string) => void;
  applyArenaToken: (token: IArenaToken) => void;
  removeArenaToken: (event: IArenaTokenRemovedEvent) => void;
  applyArenaDrag: (event: IArenaDragEvent) => void;
  clearArenaDrag: (tokenId: string) => void;
  placeArenaTokens: (moves: IMoveArenaTokenInput[]) => void;
  patchArenaTokens: (patches: IArenaTokenPatch[]) => void;
  selectArenaTokens: (tokenIds: string[], mode: ArenaSelectionMode) => void;
  setArenaViewScene: (sceneId: string | null) => void;
  startArenaLibraryLoad: () => void;
  finishArenaLibraryLoad: (library: IArenaLibrary) => void;
  failArenaLibraryLoad: (error: string) => void;
  /** Applies a library move locally and returns what to restore if the API refuses it. */
  applyArenaLibraryMove: (move: ITreeMove) => IArenaLibrary;
  restoreArenaLibrary: (library: IArenaLibrary) => void;
  toggleArenaFolder: (folderId: string) => void;
  expandArenaFolders: (folderIds: string[]) => void;
  setArenaFolders: (folderIds: string[]) => void;
  resetArena: () => void;
}

export type ArenaSlice = ArenaState & ArenaActions;
