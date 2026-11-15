import type {
  IArenaDragEvent,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
  IArenaTokenPatch,
  IMoveArenaTokenInput,
} from "@magista/shared";

import type { IArenaPoint } from "@magista/shared";
import type { ArenaSelectionMode } from "@/modules/arena/arena.types";
import type { LoadStatus } from "@/shared/types";

export interface ArenaState {
  arena: {
    status: LoadStatus;
    view: IArenaView | null;
    error: string | null;
    selectedTokenIds: string[];
    /** Live drag positions from other tabs, by token id (cleared when the final move arrives). */
    previews: Record<string, IArenaPoint>;
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
  resetArena: () => void;
}

export type ArenaSlice = ArenaState & ArenaActions;
