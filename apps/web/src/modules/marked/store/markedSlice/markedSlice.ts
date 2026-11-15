import type { StateCreator } from "zustand";

import type { AppStore } from "@/modules/shell/store/appSlice/appSlice.types";

import { defaultMarkedState } from "./markedSlice.constants";
import type { MarkedSlice } from "./markedSlice.types";

export const createMarkedSlice: StateCreator<AppStore, [], [], MarkedSlice> = (set) => ({
  ...defaultMarkedState,
  setMarkedShare: (share) => set((state) => ({ marked: { ...state.marked, share } })),
  applyMarkedProposal: (proposal) =>
    set((state) => {
      if (state.marked.outcome?.resolution.proposalId === proposal.id) return state;
      const isNew = state.marked.proposal?.id !== proposal.id;
      return {
        marked: {
          ...state.marked,
          proposal,
          outcome: isNew ? null : state.marked.outcome,
          hiddenProposalId: isNew ? null : state.marked.hiddenProposalId,
        },
      };
    }),
  applyMarkedResolution: (resolution) =>
    set((state) => {
      const proposal =
        state.marked.proposal?.id === resolution.proposalId ? state.marked.proposal : null;
      return {
        marked: {
          ...state.marked,
          proposal: proposal ? null : state.marked.proposal,
          outcome: { resolution, proposal },
          hiddenProposalId: null,
        },
      };
    }),
  dismissMarkedOutcome: () => set((state) => ({ marked: { ...state.marked, outcome: null } })),
  hideMarkedProposal: () =>
    set((state) => ({
      marked: { ...state.marked, hiddenProposalId: state.marked.proposal?.id ?? null },
    })),
  showMarkedProposal: () =>
    set((state) => ({ marked: { ...state.marked, hiddenProposalId: null } })),
  setMarkedOwnIds: (ownIds) => set((state) => ({ marked: { ...state.marked, ownIds } })),
});
