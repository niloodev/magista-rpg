import type { StateCreator } from "zustand";

import { applyTreeMove } from "@/modules/library/library.utils";
import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultArenaState } from "./arenaSlice.constants";
import type { ArenaSlice } from "./arenaSlice.types";
import { nextSelection, omitKey, upsertToken } from "./arenaSlice.utils";

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
          previews: {},
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
          previews: omitKey(state.arena.previews, token.id),
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
          previews: omitKey(state.arena.previews, id),
          selectedTokenIds: state.arena.selectedTokenIds.filter((selected) => selected !== id),
        },
      };
    }),
  applyArenaDrag: ({ moves }) =>
    set((state) => {
      const present = new Set(state.arena.view?.tokens.map((token) => token.id));
      const known = moves.filter((move) => present.has(move.tokenId));
      if (known.length === 0) return state;
      const previews = { ...state.arena.previews };
      for (const { tokenId, x, y } of known) previews[tokenId] = { x, y };
      return { arena: { ...state.arena, previews } };
    }),
  clearArenaDrag: (tokenId) =>
    set((state) => ({
      arena: { ...state.arena, previews: omitKey(state.arena.previews, tokenId) },
    })),
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
          library: { status: "ready", scenes, folders, error: null },
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
  resetArena: () => set(defaultArenaState),
});
