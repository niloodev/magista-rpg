import type {
  IArenaFolder,
  IArenaLibrary,
  IArenaScene,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
  IArenaTokenPatch,
  IMoveArenaTokenInput,
} from "@magista/shared";

import type { ArenaDockSide, ArenaSelectionMode } from "@/modules/arena/arena.types";
import type { ITreeMove } from "@/modules/library/library.types";
import type { LoadStatus } from "@/shared/types";

export interface ArenaState {
  arena: {
    status: LoadStatus;
    view: IArenaView | null;
    error: string | null;
    selectedTokenIds: string[];
    /** Scene the GM is previewing (null follows the live scene). */
    viewSceneId: string | null;
    library: {
      status: LoadStatus;
      scenes: IArenaScene[];
      folders: IArenaFolder[];
      error: string | null;
    };
    expandedFolderIds: string[];
    /** Sheets open in floating windows, bottom to top (the last one is in front). */
    openSheets: string[];
    /** Fixed cascade slot of each open window (rendering and the default position follow it, not the stack). */
    sheetSlots: Record<string, number>;
    /** Sheets docked as tabs in a side panel, and the docked tab shown on each side (null: the panel's own tab). */
    docked: Record<ArenaDockSide, string[]>;
    dockTab: Record<ArenaDockSide, string | null>;
  };
}

export interface ArenaActions {
  startArenaLoad: () => void;
  finishArenaLoad: (view: IArenaView) => void;
  failArenaLoad: (error: string) => void;
  applyArenaToken: (token: IArenaToken) => void;
  removeArenaToken: (event: IArenaTokenRemovedEvent) => void;
  /** Applies several tokens from one batch event in a single store update. */
  applyArenaTokens: (tokens: IArenaToken[]) => void;
  /** Removes several tokens from one batch event in a single store update. */
  removeArenaTokens: (events: IArenaTokenRemovedEvent[]) => void;
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
  /** Opens a sheet window (or brings it to the front); past the limit the window at the back closes. */
  openArenaSheet: (characterId: string) => void;
  closeArenaSheet: (characterId: string) => void;
  /** Moves a sheet (floating or docked elsewhere) into a side panel as a tab and shows it. */
  dockArenaSheet: (characterId: string, side: ArenaDockSide) => void;
  /** Takes a docked sheet back to a floating window. */
  undockArenaSheet: (characterId: string) => void;
  closeDockedSheet: (characterId: string) => void;
  showDockTab: (side: ArenaDockSide, characterId: string | null) => void;
  resetArena: () => void;
}

export type ArenaSlice = ArenaState & ArenaActions;
