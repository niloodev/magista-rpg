import type { IMarkedShare } from "@magista/shared";

import type {
  IMarkedAudience,
  IMarkedController,
  IMarkedProposalPayload,
  IMarkedResolutionPayload,
} from "@/core/controllers/marked";

export interface IMarkedHandlerDeps {
  controller: IMarkedController;
  onProposal: (payload: IMarkedProposalPayload) => void;
  onResolved: (payload: IMarkedResolutionPayload) => void;
  onShare: (share: IMarkedShare | null, audience: IMarkedAudience) => void;
}
