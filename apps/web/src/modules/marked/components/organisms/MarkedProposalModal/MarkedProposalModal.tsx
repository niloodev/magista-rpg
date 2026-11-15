"use client";

import { toMediaUrl } from "@/core/services/http";
import { MarkedSigil } from "@/modules/marked/components/atoms";
import { STATUS_LABELS } from "@/modules/marked/marked.constants";
import { Avatar, Button, Icon, Text } from "@/shared/components/atoms";
import { ExpandableText, Modal } from "@/shared/components/molecules";

import { PROPOSAL_TEXTS, STATUS_CHIP_CLASSES } from "./MarkedProposalModal.constants";
import { useMarkedProposalModal } from "./MarkedProposalModal.hook";
import { acceptButtonId } from "./MarkedProposalModal.utils";

export function MarkedProposalModal() {
  const {
    proposal,
    outcome,
    seconds,
    targets,
    firstAnswerableId,
    canCancel,
    busyId,
    error,
    onAnswer,
    onCancel,
    onLater,
    onCloseOutcome,
  } = useMarkedProposalModal();

  if (outcome && !proposal) {
    const { united } = outcome;
    return (
      <Modal
        open
        onClose={onCloseOutcome}
        title={outcome.text.title}
        size="sm"
        footer={
          <Button variant="secondary" size="sm" onClick={onCloseOutcome} data-autofocus="">
            {PROPOSAL_TEXTS.close}
          </Button>
        }
      >
        <div role="status" className="flex flex-col items-center gap-4 text-center">
          <MarkedSigil
            runes={united}
            animated={united}
            className={`h-36 w-36 animate-marked-seal ${united ? "" : "opacity-40 grayscale"}`}
          />
          {outcome.proposal && (
            <p className="font-serif text-xl text-gold-200">{outcome.proposal.trait.name}</p>
          )}
          <Text variant="body">{outcome.text.message}</Text>
        </div>
      </Modal>
    );
  }

  if (!proposal) return null;

  return (
    <Modal
      open
      onClose={onLater}
      title={PROPOSAL_TEXTS.title}
      description={`${proposal.source.name} ${PROPOSAL_TEXTS.description}`}
      size="md"
      footer={
        <>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={busyId !== null}
              icon={<Icon name="circle-x" size={14} />}
            >
              {PROPOSAL_TEXTS.cancel}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onLater}>
            {PROPOSAL_TEXTS.later}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="relative overflow-hidden border border-gold-400/40 bg-[linear-gradient(135deg,rgba(92,11,37,0.85),rgba(18,4,10,0.95)_65%)] p-4">
          <MarkedSigil
            animated
            className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 opacity-25"
          />
          <div className="relative flex items-center gap-3">
            <Avatar
              src={toMediaUrl(proposal.source.portraitUrl)}
              name={proposal.source.name}
              size="md"
              shape="circle"
              decorative
            />
            <div className="min-w-0">
              <Text variant="micro">Traço oferecido</Text>
              <p className="font-serif text-xl text-gold-200">{proposal.trait.name}</p>
            </div>
          </div>
          {proposal.trait.description && (
            <ExpandableText text={proposal.trait.description} className="relative mt-3" />
          )}
        </div>
        <p className="flex items-center gap-2 font-sans text-sm text-muted-strong">
          <Icon name="hourglass" size={14} className="text-gold-300" />
          {PROPOSAL_TEXTS.countdown}{" "}
          <span className="font-serif text-base text-gold-300 tabular-nums">{seconds}s</span>
        </p>
        <ul aria-live="polite" className="flex flex-col gap-2">
          <li className="flex min-h-11 items-center gap-3 border border-white/10 bg-black/30 px-3 py-2">
            <Avatar
              src={toMediaUrl(proposal.source.portraitUrl)}
              name={proposal.source.name}
              size="xs"
              shape="circle"
              decorative
            />
            <span className="min-w-0 flex-1 truncate font-serif text-base">
              {proposal.source.name}
            </span>
            <span className="border border-gold-400/50 bg-gold-400/10 px-2 py-0.5 font-sans text-xs font-semibold text-gold-300">
              {PROPOSAL_TEXTS.sourceTag}
            </span>
          </li>
          {targets.map((target) => (
            <li
              key={target.characterId}
              className="flex min-h-11 flex-wrap items-center gap-3 border border-white/10 bg-black/30 px-3 py-2"
            >
              <Avatar
                src={toMediaUrl(target.portraitUrl)}
                name={target.name}
                size="xs"
                shape="circle"
                decorative
              />
              <span className="min-w-[8rem] flex-1 truncate font-serif text-base">
                {target.name}
              </span>
              {target.answerable ? (
                <span className="flex gap-2 max-sm:w-full max-sm:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAnswer(target.characterId, false)}
                    disabled={busyId !== null}
                    aria-label={`${PROPOSAL_TEXTS.decline} por ${target.name}`}
                  >
                    {PROPOSAL_TEXTS.decline}
                  </Button>
                  <Button
                    variant="mystic"
                    size="sm"
                    id={acceptButtonId(target.characterId)}
                    onClick={() => onAnswer(target.characterId, true)}
                    loading={busyId === target.characterId}
                    disabled={busyId !== null}
                    data-autofocus={firstAnswerableId === target.characterId ? "" : undefined}
                    aria-label={`${PROPOSAL_TEXTS.accept} por ${target.name}`}
                    icon={<Icon name="sparkles" size={14} />}
                  >
                    {PROPOSAL_TEXTS.accept}
                  </Button>
                </span>
              ) : (
                <span
                  className={`border px-2 py-0.5 font-sans text-xs font-semibold ${STATUS_CHIP_CLASSES[target.status]}`}
                >
                  {STATUS_LABELS[target.status]}
                </span>
              )}
            </li>
          ))}
        </ul>
        {!firstAnswerableId && <Text variant="hint">{PROPOSAL_TEXTS.waiting}</Text>}
        {error && (
          <Text variant="body" role="alert" className="text-error">
            {error}
          </Text>
        )}
      </div>
    </Modal>
  );
}
