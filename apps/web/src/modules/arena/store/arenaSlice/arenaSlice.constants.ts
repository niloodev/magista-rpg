import type { ArenaState } from "./arenaSlice.types";

export const defaultArenaState: ArenaState = {
  arena: {
    status: "idle",
    view: null,
    turnOrder: null,
    error: null,
    selectedTokenIds: [],
    viewSceneId: null,
    library: { status: "idle", scenes: [], folders: [], error: null },
    expandedFolderIds: [],
    openSheets: [],
    sheetSlots: {},
    docked: { left: [], right: [] },
    dockTab: { left: null, right: null },
    tokenClipboard: [],
    turnRolling: {},
  },
};
