import type { StateCreator } from "zustand";

import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultArenaState } from "./arenaSlice.constants";
import type { ArenaSlice } from "./arenaSlice.types";
import { omitKey, upsertToken } from "./arenaSlice.utils";

export const createArenaSlice: StateCreator<AppStore, [], [], ArenaSlice> = (set) => ({
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
      const selected = state.arena.selectedTokenId;
      return {
        arena: {
          ...state.arena,
          status: "ready",
          view,
          error: null,
          previews: {},
          selectedTokenId: view.tokens.some((token) => token.id === selected) ? selected : null,
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
          selectedTokenId: state.arena.selectedTokenId === id ? null : state.arena.selectedTokenId,
        },
      };
    }),
  applyArenaDrag: ({ tokenId, x, y }) =>
    set((state) => {
      if (!state.arena.view?.tokens.some((token) => token.id === tokenId)) return state;
      return {
        arena: { ...state.arena, previews: { ...state.arena.previews, [tokenId]: { x, y } } },
      };
    }),
  clearArenaDrag: (tokenId) =>
    set((state) => ({
      arena: { ...state.arena, previews: omitKey(state.arena.previews, tokenId) },
    })),
  placeArenaToken: (tokenId, { x, y }) =>
    set((state) => {
      const view = state.arena.view;
      if (!view) return state;
      return {
        arena: {
          ...state.arena,
          view: {
            ...view,
            tokens: view.tokens.map((token) => (token.id === tokenId ? { ...token, x, y } : token)),
          },
        },
      };
    }),
  selectArenaToken: (tokenId) =>
    set((state) => ({ arena: { ...state.arena, selectedTokenId: tokenId } })),
  resetArena: () => set(defaultArenaState),
});
