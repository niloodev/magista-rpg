"use client";

import { useEffect, useState } from "react";

import { MARKED_COUNTDOWN_TICK_MS } from "@/modules/marked/marked.constants";
import {
  actsFor,
  answerableTargets,
  outcomeText,
  secondsLeft,
} from "@/modules/marked/marked.utils";
import { answerMarkedShare, cancelMarkedShare } from "@/modules/marked/services";
import { useApp } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

import { acceptButtonId } from "./MarkedProposalModal.utils";

/**
 * Drives the Marca popup shown to every Marcado (and the GM): the live proposal with a countdown and one
 * answer per sheet the viewer acts for, then the outcome once it resolves.
 */
export function useMarkedProposalModal() {
  const socket = useTableSocket();
  const proposal = useApp((state) => state.marked.proposal);
  const outcome = useApp((state) => state.marked.outcome);
  const hiddenProposalId = useApp((state) => state.marked.hiddenProposalId);
  const ownIds = useApp((state) => state.marked.ownIds);
  const isGm = useApp((state) => state.session.data?.account.role === "GM");
  const hideMarkedProposal = useApp((state) => state.hideMarkedProposal);
  const dismissMarkedOutcome = useApp((state) => state.dismissMarkedOutcome);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const viewer = { isGm, ownIds: ownIds ?? [] };
  const showProposal = proposal !== null && hiddenProposalId !== proposal.id;

  const firstAnswerableId =
    proposal && showProposal ? (answerableTargets(proposal, viewer)[0]?.characterId ?? null) : null;

  useEffect(() => {
    if (firstAnswerableId) document.getElementById(acceptButtonId(firstAnswerableId))?.focus();
  }, [firstAnswerableId]);

  useEffect(() => {
    if (!proposal) return;
    const timer = window.setInterval(() => setNow(Date.now()), MARKED_COUNTDOWN_TICK_MS);
    return () => window.clearInterval(timer);
  }, [proposal]);

  const answer = async (characterId: string, accept: boolean) => {
    if (!proposal) return;
    setBusyId(characterId);
    const result = await answerMarkedShare(socket, {
      proposalId: proposal.id,
      characterId,
      accept,
    });
    setBusyId(null);
    setError(result.ok ? null : result.error);
  };

  const cancel = async () => {
    if (!proposal) return;
    setBusyId(proposal.source.characterId);
    const result = await cancelMarkedShare(socket, proposal.id);
    setBusyId(null);
    setError(result.ok ? null : result.error);
  };

  return {
    proposal: showProposal ? proposal : null,
    outcome: outcome
      ? {
          ...outcome,
          text: outcomeText(outcome),
          united: outcome.resolution.outcome === "accepted",
        }
      : null,
    seconds: proposal ? secondsLeft(proposal.expiresAt, now) : 0,
    targets: proposal
      ? proposal.targets.map((target) => ({
          ...target,
          answerable: answerableTargets(proposal, viewer).some(
            (entry) => entry.characterId === target.characterId,
          ),
        }))
      : [],
    firstAnswerableId,
    canCancel: proposal ? actsFor(viewer, proposal.source.characterId) : false,
    busyId,
    error,
    onAnswer: (characterId: string, accept: boolean) => void answer(characterId, accept),
    onCancel: () => void cancel(),
    onLater: () => {
      setError(null);
      hideMarkedProposal();
    },
    onCloseOutcome: () => {
      setError(null);
      dismissMarkedOutcome();
    },
  };
}
