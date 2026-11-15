import type { IMarkedProposal } from "./marked.types";

/**
 * Whether every target of a proposal already accepted the shared trait.
 */
export function allTargetsAccepted(proposal: IMarkedProposal): boolean {
  return proposal.targets.every((target) => target.status === "accepted");
}

/**
 * Characters involved in a proposal (source first), used to address its events.
 */
export function proposalCharacterIds(proposal: IMarkedProposal): string[] {
  return [proposal.source.characterId, ...proposal.targets.map((target) => target.characterId)];
}
