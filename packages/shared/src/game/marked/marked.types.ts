import type { z } from "zod";

import type { MARKED_OUTCOMES, MARKED_TARGET_STATUSES } from "./marked.constants";
import type {
  markedAnswerSchema,
  markedCancelSchema,
  markedProposeSchema,
  markedStopSchema,
} from "./marked.schemas";

export type IMarkedProposeInput = z.infer<typeof markedProposeSchema>;

export type IMarkedAnswerInput = z.infer<typeof markedAnswerSchema>;

export type IMarkedCancelInput = z.infer<typeof markedCancelSchema>;

export type IMarkedStopInput = z.infer<typeof markedStopSchema>;

export type MarkedTargetStatus = (typeof MARKED_TARGET_STATUSES)[number];

export type MarkedOutcome = (typeof MARKED_OUTCOMES)[number];

export interface IMarkedParticipant {
  characterId: string;
  name: string;
  portraitUrl: string | null;
}

export interface IMarkedTarget extends IMarkedParticipant {
  status: MarkedTargetStatus;
}

export interface IMarkedTrait {
  name: string;
  description: string;
}

export interface IMarkedProposal {
  id: string;
  source: IMarkedParticipant;
  trait: IMarkedTrait;
  targets: IMarkedTarget[];
  expiresAt: string;
}

export interface IMarkedShare {
  id: string;
  source: IMarkedParticipant;
  trait: IMarkedTrait;
  startedAt: string;
}

export interface IMarkedResolution {
  proposalId: string;
  outcome: MarkedOutcome;
  /** Name of the character whose answer (or silence) decided a failed proposal. */
  decidedBy: string | null;
}
