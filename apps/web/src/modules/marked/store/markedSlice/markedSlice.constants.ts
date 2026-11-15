import type { MarkedState } from "./markedSlice.types";

export const defaultMarkedState: MarkedState = {
  marked: { share: null, proposal: null, outcome: null, hiddenProposalId: null, ownIds: null },
};
