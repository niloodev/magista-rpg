import type { ArenaState } from "./arenaSlice.types";

export const defaultArenaState: ArenaState = {
  arena: {
    status: "idle",
    view: null,
    error: null,
    selectedTokenIds: [],
    previews: {},
    viewSceneId: null,
    library: { status: "idle", scenes: [], folders: [], error: null },
    expandedFolderIds: [],
  },
};
