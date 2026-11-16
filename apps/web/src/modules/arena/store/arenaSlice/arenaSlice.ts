import type { StateCreator } from "zustand";

import { applyTreeMove, reuseUnchanged } from "@/modules/library/library.utils";
import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultArenaState } from "./arenaSlice.constants";
import type { ArenaSlice } from "./arenaSlice.types";
import {
  clearDockTab,
  nextSelection,
  omitKey,
  slotsFor,
  upsertToken,
  upsertTokens,
  withCharacterStatus,
  withoutDocked,
  withSheetOnTop,
  withStatusEntries,
} from "./arenaSlice.utils";

export const createArenaSlice: StateCreator<AppStore, [], [], ArenaSlice> = (set, get) => ({
  ...defaultArenaState,
  startArenaLoad: () =>
    set((state) => ({
      arena: {
        ...state.arena,
        status: state.arena.view ? state.arena.status : "loading",
        error: null,
      },
    })),
  finishArenaLoad: (view) =>
    set((state) => {
      const present = new Set(view.tokens.map((token) => token.id));
      return {
        arena: {
          ...state.arena,
          status: "ready",
          view,
          error: null,
          selectedTokenIds: state.arena.selectedTokenIds.filter((id) => present.has(id)),
        },
      };
    }),
  failArenaLoad: (error) =>
    set((state) => ({
      arena: { ...state.arena, status: state.arena.view ? "ready" : "error", error },
    })),
  applyArenaToken: (token) =>
    set((state) => {
      const view = state.arena.view;
      if (!view || view.scene?.id !== token.sceneId) return state;
      return {
        arena: {
          ...state.arena,
          view: { ...view, tokens: upsertToken(view.tokens, token) },
        },
      };
    }),
  removeArenaToken: ({ id, sceneId }) =>
    set((state) => {
      const view = state.arena.view;
      if (!view || view.scene?.id !== sceneId) return state;
      return {
        arena: {
          ...state.arena,
          view: { ...view, tokens: view.tokens.filter((token) => token.id !== id) },
          selectedTokenIds: state.arena.selectedTokenIds.filter((selected) => selected !== id),
        },
      };
    }),
  applyArenaTokens: (tokens) =>
    set((state) => {
      const view = state.arena.view;
      const sceneId = view?.scene?.id;
      const incoming = tokens.filter((token) => token.sceneId === sceneId);
      if (!view || incoming.length === 0) return state;
      return {
        arena: {
          ...state.arena,
          view: { ...view, tokens: upsertTokens(view.tokens, incoming) },
        },
      };
    }),
  removeArenaTokens: (events) =>
    set((state) => {
      const view = state.arena.view;
      const sceneId = view?.scene?.id;
      const gone = new Set(
        events.filter((event) => event.sceneId === sceneId).map((event) => event.id),
      );
      if (!view || gone.size === 0) return state;
      return {
        arena: {
          ...state.arena,
          view: { ...view, tokens: view.tokens.filter((token) => !gone.has(token.id)) },
          selectedTokenIds: state.arena.selectedTokenIds.filter((selected) => !gone.has(selected)),
        },
      };
    }),
  placeArenaTokens: (moves) =>
    set((state) => {
      const view = state.arena.view;
      if (!view) return state;
      const byId = new Map(moves.map((move) => [move.tokenId, move]));
      return {
        arena: {
          ...state.arena,
          view: {
            ...view,
            tokens: view.tokens.map((token) => {
              const move = byId.get(token.id);
              return move ? { ...token, x: move.x, y: move.y } : token;
            }),
          },
        },
      };
    }),
  patchArenaTokens: (patches) =>
    set((state) => {
      const view = state.arena.view;
      if (!view) return state;
      const byId = new Map(patches.map((patch) => [patch.id, patch]));
      return {
        arena: {
          ...state.arena,
          view: {
            ...view,
            tokens: view.tokens.map((token) => {
              const patch = byId.get(token.id);
              if (!patch) return token;
              return {
                ...token,
                size: patch.size ?? token.size,
                hidden: patch.hidden ?? token.hidden,
                name: patch.name ?? token.name,
              };
            }),
          },
        },
      };
    }),
  applyArenaStatus: ({ sceneId, entries }) =>
    set((state) => {
      const view = state.arena.view;
      if (!view || view.scene?.id !== sceneId || entries.length === 0) return state;
      return { arena: { ...state.arena, view: { ...view, ...withStatusEntries(view, entries) } } };
    }),
  applyCharacterStatus: (characterId, status) =>
    set((state) => {
      const view = state.arena.view;
      if (!view) return state;
      const statuses = withCharacterStatus(view, characterId, status);
      if (statuses === view.statuses) return state;
      return { arena: { ...state.arena, view: { ...view, statuses } } };
    }),
  selectArenaTokens: (tokenIds, mode) =>
    set((state) => ({
      arena: {
        ...state.arena,
        selectedTokenIds: nextSelection(state.arena.selectedTokenIds, tokenIds, mode),
      },
    })),
  setArenaViewScene: (sceneId) =>
    set((state) => ({ arena: { ...state.arena, viewSceneId: sceneId } })),
  startArenaLibraryLoad: () =>
    set((state) => ({
      arena: {
        ...state.arena,
        library: {
          ...state.arena.library,
          status: state.arena.library.status === "ready" ? "ready" : "loading",
          error: null,
        },
      },
    })),
  finishArenaLibraryLoad: ({ scenes, folders }) =>
    set((state) => {
      const present = new Set(folders.map((folder) => folder.id));
      return {
        arena: {
          ...state.arena,
          library: {
            status: "ready",
            scenes: reuseUnchanged(state.arena.library.scenes, scenes),
            folders: reuseUnchanged(state.arena.library.folders, folders),
            error: null,
          },
          expandedFolderIds: state.arena.expandedFolderIds.filter((id) => present.has(id)),
        },
      };
    }),
  failArenaLibraryLoad: (error) =>
    set((state) => ({
      arena: {
        ...state.arena,
        library: {
          ...state.arena.library,
          status: state.arena.library.status === "ready" ? "ready" : "error",
          error,
        },
      },
    })),
  applyArenaLibraryMove: (move) => {
    const { scenes, folders } = get().arena.library;
    const moved = applyTreeMove({ folders, leaves: scenes }, move);
    set((state) => ({
      arena: {
        ...state.arena,
        library: { ...state.arena.library, scenes: moved.leaves, folders: moved.folders },
      },
    }));
    return { scenes, folders };
  },
  restoreArenaLibrary: ({ scenes, folders }) =>
    set((state) => ({
      arena: { ...state.arena, library: { ...state.arena.library, scenes, folders } },
    })),
  toggleArenaFolder: (folderId) =>
    set((state) => {
      const expanded = state.arena.expandedFolderIds;
      return {
        arena: {
          ...state.arena,
          expandedFolderIds: expanded.includes(folderId)
            ? expanded.filter((id) => id !== folderId)
            : [...expanded, folderId],
        },
      };
    }),
  expandArenaFolders: (folderIds) =>
    set((state) => ({
      arena: {
        ...state.arena,
        expandedFolderIds: [...new Set([...state.arena.expandedFolderIds, ...folderIds])],
      },
    })),
  setArenaFolders: (folderIds) =>
    set((state) => ({ arena: { ...state.arena, expandedFolderIds: folderIds } })),
  openArenaSheet: (characterId) =>
    set((state) => {
      const openSheets = withSheetOnTop(state.arena.openSheets, characterId);
      if (openSheets === state.arena.openSheets) return state;
      return {
        arena: {
          ...state.arena,
          openSheets,
          sheetSlots: slotsFor(openSheets, state.arena.sheetSlots, characterId),
        },
      };
    }),
  closeArenaSheet: (characterId) =>
    set((state) => ({
      arena: {
        ...state.arena,
        openSheets: state.arena.openSheets.filter((id) => id !== characterId),
        sheetSlots: omitKey(state.arena.sheetSlots, characterId),
      },
    })),
  dockArenaSheet: (characterId, side) =>
    set((state) => {
      const docked = withoutDocked(state.arena.docked, characterId);
      return {
        arena: {
          ...state.arena,
          openSheets: state.arena.openSheets.filter((id) => id !== characterId),
          sheetSlots: omitKey(state.arena.sheetSlots, characterId),
          docked: { ...docked, [side]: [...docked[side], characterId] },
          dockTab: { ...clearDockTab(state.arena.dockTab, characterId), [side]: characterId },
        },
      };
    }),
  undockArenaSheet: (characterId) =>
    set((state) => {
      const openSheets = withSheetOnTop(state.arena.openSheets, characterId);
      return {
        arena: {
          ...state.arena,
          docked: withoutDocked(state.arena.docked, characterId),
          dockTab: clearDockTab(state.arena.dockTab, characterId),
          openSheets,
          sheetSlots: slotsFor(openSheets, state.arena.sheetSlots, characterId),
        },
      };
    }),
  closeDockedSheet: (characterId) =>
    set((state) => ({
      arena: {
        ...state.arena,
        docked: withoutDocked(state.arena.docked, characterId),
        dockTab: clearDockTab(state.arena.dockTab, characterId),
      },
    })),
  showDockTab: (side, characterId) =>
    set((state) => ({
      arena: { ...state.arena, dockTab: { ...state.arena.dockTab, [side]: characterId } },
    })),
  resetArena: () => set(defaultArenaState),
});
