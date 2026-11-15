import type {
  IArenaDragEvent,
  IArenaPoint,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
} from "@magista/shared";

import type { LoadStatus } from "@/shared/types";

export interface ArenaState {
  arena: {
    status: LoadStatus;
    view: IArenaView | null;
    error: string | null;
    selectedTokenId: string | null;
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
  placeArenaToken: (tokenId: string, point: IArenaPoint) => void;
  selectArenaToken: (tokenId: string | null) => void;
  resetArena: () => void;
}

export type ArenaSlice = ArenaState & ArenaActions;
