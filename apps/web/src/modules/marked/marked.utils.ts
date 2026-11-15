import {
  MARKED_ANSWER_TIMEOUT_MS,
  type IMarkedProposal,
  type IMarkedTarget,
} from "@magista/shared";

import { OUTCOME_TEXTS } from "./marked.constants";
import type { IMarkedOutcome, IMarkedViewer } from "./marked.types";

/**
 * Whether the viewer acts for a character: the GM for any, a player for the ones granted to the account.
 */
export function actsFor(viewer: IMarkedViewer, characterId: string): boolean {
  return viewer.isGm || viewer.ownIds.includes(characterId);
}

/**
 * Pending targets of a proposal the viewer may answer for.
 */
export function answerableTargets(
  proposal: IMarkedProposal,
  viewer: IMarkedViewer,
): IMarkedTarget[] {
  return proposal.targets.filter(
    (target) => target.status === "pending" && actsFor(viewer, target.characterId),
  );
}

/**
 * Seconds left until the proposal deadline, never negative.
 */
export function secondsLeft(expiresAt: string, now: number): number {
  const left = Math.ceil((new Date(expiresAt).getTime() - now) / 1000);
  return Math.min(MARKED_ANSWER_TIMEOUT_MS / 1000, Math.max(0, left));
}

/**
 * Title and message shown when a proposal ends (names who refused or let it expire).
 */
export function outcomeText({ resolution }: IMarkedOutcome): { title: string; message: string } {
  const texts = OUTCOME_TEXTS[resolution.outcome];
  if (resolution.outcome === "declined" || resolution.outcome === "expired") {
    return {
      title: texts.title,
      message: resolution.decidedBy
        ? `${resolution.decidedBy} ${texts.message}`
        : `Um Marcado ${texts.message}`,
    };
  }
  return { title: texts.title, message: texts.message };
}
