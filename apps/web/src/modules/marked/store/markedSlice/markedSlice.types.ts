import type { IMarkedProposal, IMarkedResolution, IMarkedShare } from "@magista/shared";

import type { IMarkedOutcome } from "@/modules/marked/marked.types";

export interface MarkedState {
  marked: {
    share: IMarkedShare | null;
    proposal: IMarkedProposal | null;
    outcome: IMarkedOutcome | null;
    /** Proposal the viewer closed to answer later (reopened from the Alma de Marcado panel). */
    hiddenProposalId: string | null;
    /** Characters granted to this account (null until loaded); the GM acts for every one. */
    ownIds: string[] | null;
  };
}

export interface MarkedActions {
  setMarkedShare: (share: IMarkedShare | null) => void;
  applyMarkedProposal: (proposal: IMarkedProposal) => void;
  applyMarkedResolution: (resolution: IMarkedResolution) => void;
  dismissMarkedOutcome: () => void;
  hideMarkedProposal: () => void;
  showMarkedProposal: () => void;
  setMarkedOwnIds: (ids: string[]) => void;
}

export type MarkedSlice = MarkedState & MarkedActions;
