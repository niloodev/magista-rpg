"use client";

import { useState } from "react";

import { useMarkedShare } from "@/modules/marked/hooks";
import { MARKED_TEXTS } from "@/modules/marked/marked.constants";
import { answerableTargets } from "@/modules/marked/marked.utils";
import { proposeMarkedShare } from "@/modules/marked/services";
import { useApp } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";

import type { MarkedSoulPanelProps } from "./MarkedSoulPanel.types";

/**
 * State of the Marca for one sheet: what blocks a new share, the share dialog and the pending proposal the viewer
 * closed to answer later.
 */
export function useMarkedSoulPanel({ characterId, traits, onBeforeShare }: MarkedSoulPanelProps) {
  const socket = useTableSocket();
  const controls = useMarkedShare(characterId);
  const proposal = useApp((state) => state.marked.proposal);
  const hiddenProposalId = useApp((state) => state.marked.hiddenProposalId);
  const ownIds = useApp((state) => state.marked.ownIds);
  const showMarkedProposal = useApp((state) => state.showMarkedProposal);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const blockedReason = controls.share
    ? MARKED_TEXTS.shareBlock
    : proposal
      ? MARKED_TEXTS.pendingBlock
      : traits.length === 0
        ? MARKED_TEXTS.noTraits
        : null;
  const canReopen =
    proposal !== null &&
    hiddenProposalId === proposal.id &&
    answerableTargets(proposal, { isGm: controls.isGm, ownIds: ownIds ?? [] }).length > 0;

  const submit = async (traitId: string) => {
    setSending(true);
    await onBeforeShare();
    const result = await proposeMarkedShare(socket, { characterId, traitId });
    setSending(false);
    if (!result.ok) {
      setShareError(result.error);
      return;
    }
    setShareError(null);
    setDialogOpen(false);
  };

  return {
    ...controls,
    proposal,
    blockedReason,
    canReopen,
    reopen: showMarkedProposal,
    dialogOpen,
    sending,
    shareError,
    openDialog: () => {
      setShareError(null);
      setDialogOpen(true);
    },
    closeDialog: () => setDialogOpen(false),
    submit: (traitId: string) => void submit(traitId),
  };
}
