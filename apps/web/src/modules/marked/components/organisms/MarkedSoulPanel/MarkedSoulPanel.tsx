"use client";

import { MARKED_RULES, MARKED_TEXTS, STOP_LABEL } from "@/modules/marked/marked.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";
import { ConfirmDialog, Panel, SectionHeader } from "@/shared/components/molecules";

import { MarkedShareDialog } from "../MarkedShareDialog";
import { BLOCKED_REASON_ID } from "./MarkedSoulPanel.constants";
import { useMarkedSoulPanel } from "./MarkedSoulPanel.hook";
import type { MarkedSoulPanelProps } from "./MarkedSoulPanel.types";

export function MarkedSoulPanel(props: MarkedSoulPanelProps) {
  const {
    share,
    proposal,
    canStop,
    stopping,
    stopError,
    confirming,
    requestStop,
    cancelStop,
    confirmStop,
    blockedReason,
    canReopen,
    reopen,
    dialogOpen,
    sending,
    shareError,
    openDialog,
    closeDialog,
    submit,
  } = useMarkedSoulPanel(props);
  return (
    <Panel
      variant="primary"
      aria-label={MARKED_TEXTS.panelTitle}
      className="relative overflow-hidden p-5"
    >
      <div className="relative">
        <SectionHeader
          title={MARKED_TEXTS.panelTitle}
          icon="sparkles"
          aside={
            <Button
              variant="mystic"
              size="sm"
              onClick={openDialog}
              disabled={blockedReason !== null}
              aria-describedby={blockedReason ? BLOCKED_REASON_ID : undefined}
              className="whitespace-nowrap"
              icon={<Icon name="link-2" size={14} />}
            >
              {MARKED_TEXTS.share}
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          {MARKED_RULES.map((rule) => (
            <div key={rule.title}>
              <Text variant="fieldLabel" as="p" className="mb-1">
                {rule.title}
              </Text>
              <Text variant="body">{rule.text}</Text>
            </div>
          ))}
        </div>
        <div
          aria-live="polite"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-gold-400/25 bg-black/40 px-4 py-3"
        >
          {share ? (
            <p className="min-w-0 font-sans text-[15px] text-muted-strong">
              <span className="font-semibold text-gold-300">{MARKED_TEXTS.activeLabel}:</span>{" "}
              <span className="font-serif text-foreground">{share.trait.name}</span>,{" "}
              {MARKED_TEXTS.sharedBy} {share.source.name}.
            </p>
          ) : proposal ? (
            <p className="font-sans text-[15px] text-muted-strong">
              <Icon name="hourglass" size={14} className="mr-2 inline text-gold-300" />
              {proposal.source.name} chama a Marca para compartilhar{" "}
              <span className="font-serif text-foreground">{proposal.trait.name}</span>.
            </p>
          ) : (
            <p className="font-sans text-[15px] text-muted-strong">{MARKED_TEXTS.noShare}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {canReopen && (
              <Button variant="mystic" size="sm" onClick={reopen}>
                {MARKED_TEXTS.reopen}
              </Button>
            )}
            {canStop && (
              <Button
                variant="secondary"
                size="sm"
                onClick={requestStop}
                loading={stopping}
                icon={<Icon name="circle-x" size={14} />}
              >
                {MARKED_TEXTS.stop}
              </Button>
            )}
          </div>
        </div>
        {blockedReason && (
          <p id={BLOCKED_REASON_ID} className="mt-2 font-sans text-sm text-hint">
            {blockedReason}
          </p>
        )}
        {stopError && (
          <Text variant="body" role="alert" className="mt-2 text-error">
            {stopError}
          </Text>
        )}
      </div>
      <MarkedShareDialog
        open={dialogOpen}
        traits={props.traits}
        loading={sending}
        error={shareError}
        onClose={closeDialog}
        onSubmit={submit}
      />
      <ConfirmDialog
        open={confirming}
        title={MARKED_TEXTS.stopConfirmTitle}
        message={MARKED_TEXTS.stopConfirmMessage}
        confirmLabel={STOP_LABEL}
        onConfirm={confirmStop}
        onCancel={cancelStop}
      />
    </Panel>
  );
}
