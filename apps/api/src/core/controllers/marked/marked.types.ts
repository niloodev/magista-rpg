import type {
  ControllerResult,
  IMarkedProposal,
  IMarkedResolution,
  IMarkedShare,
} from "@magista/shared";

import type { ICharacterModels } from "@/core/models/character";
import type { IMarkedShareModels } from "@/core/models/markedShare";

import type { IViewer } from "../controllers.types";
import type { MarkedError } from "./marked.errors";

export interface IMarkedControllerDeps {
  characters: Pick<ICharacterModels, "findById" | "hasAccess" | "listByFeature">;
  shares: IMarkedShareModels;
  /** Whether someone who can answer for the character (a player with access or the GM) is at the table. */
  isAttended: (characterId: string) => Promise<boolean>;
  createId: () => string;
  now: () => Date;
  timeoutMs: number;
}

/** Characters whose rooms (plus the GM) must hear about a change. */
export interface IMarkedAudience {
  characterIds: string[];
}

export interface IMarkedAnswerPayload extends IMarkedAudience {
  proposal: IMarkedProposal;
  resolution: IMarkedResolution | null;
  share: IMarkedShare | null;
}

export interface IMarkedResolutionPayload extends IMarkedAudience {
  resolution: IMarkedResolution;
}

export interface IMarkedProposalPayload extends IMarkedAudience {
  proposal: IMarkedProposal;
}

/** `characterIds` are the Marcados that still carry the tag (the only ones that may see the share). */
export interface IMarkedReleasePayload extends IMarkedAudience {
  resolution: IMarkedResolution | null;
  /** Characters of the proposal that was cancelled (they hear the resolution). */
  involvedIds: string[];
  /** Whether the released character still carries the tag. */
  stillMarked: boolean;
  /** Share still active after the release (the database may have dropped it with a deleted character). */
  share: IMarkedShare | null;
}

type Result<T> = Promise<ControllerResult<T, MarkedError>>;

export interface IMarkedController {
  propose: (viewer: IViewer, input: unknown) => Result<IMarkedProposalPayload>;
  answer: (viewer: IViewer, input: unknown) => Result<IMarkedAnswerPayload>;
  cancel: (viewer: IViewer, input: unknown) => Result<IMarkedResolutionPayload>;
  stop: (viewer: IViewer, input: unknown) => Result<IMarkedAudience>;
  /** Share visible to this viewer: the GM, or a player with access to a Marcado. */
  current: (viewer: IViewer) => Result<IMarkedShare | null>;
  /** Pending proposal visible to this viewer (the GM, or a player of a sheet involved in it). */
  pendingFor: (viewer: IViewer) => Promise<IMarkedProposal | null>;
  /** Ends a pending proposal after its deadline; null when it was already resolved. */
  expire: (proposalId: string) => Promise<IMarkedResolutionPayload | null>;
  /** Drops the pending proposal and the share involving a character that lost the tag or was deleted. */
  release: (characterId: string) => Promise<IMarkedReleasePayload>;
}
