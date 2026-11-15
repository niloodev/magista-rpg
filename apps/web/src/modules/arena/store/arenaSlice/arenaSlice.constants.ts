import type { ArenaState } from "./arenaSlice.types";

export const defaultArenaState: ArenaState = {
  arena: { status: "idle", view: null, error: null, selectedTokenId: null, previews: {} },
};
