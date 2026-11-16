"use client";

import { ARENA_CHANGE_TEXTS, ARENA_STATUS_TEXTS } from "@/modules/arena/arena.constants";
import { ResourceBar } from "@/modules/sheet/components/molecules";
import { Button, Checkbox, Icon } from "@/shared/components/atoms";
import { AccountChecklist, Modal } from "@/shared/components/molecules";

import {
  SECTION_CLASS,
  SECTION_TITLE_CLASS,
  SETTINGS_ACCOUNT_SKELETON_ROWS,
} from "./ArenaTokenSettingsDialog.constants";
import { useArenaTokenSettingsDialog } from "./ArenaTokenSettingsDialog.hook";
import type { ArenaTokenSettingsDialogProps } from "./ArenaTokenSettingsDialog.types";

/**
 * Settings of one token (GM): its health and sanity (own values for an NPC, the sheet ones for a character
 * token) and who may see them (every player or chosen accounts; the accounts with access to the sheet always do).
 */
export function ArenaTokenSettingsDialog({
  target,
  accounts,
  accountsStatus,
  onRetryAccounts,
  onSubmit,
  onOpenSheet,
  onClose,
}: ArenaTokenSettingsDialogProps) {
  const {
    formId,
    openSheet,
    npc,
    health,
    setHealth,
    sanity,
    setSanity,
    everyone,
    setEveryone,
    viewerIds,
    toggleViewer,
    error,
    pending,
    submit,
  } = useArenaTokenSettingsDialog({ target, onSubmit, onOpenSheet });
  return (
    <Modal
      open
      onClose={onClose}
      title={ARENA_STATUS_TEXTS.settingsTitle}
      description={ARENA_STATUS_TEXTS.settingsDescription(target.token.name)}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ARENA_STATUS_TEXTS.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            icon={<Icon name="check" size={14} />}
          >
            {ARENA_STATUS_TEXTS.save}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <section aria-labelledby={`${formId}-status`} className={SECTION_CLASS}>
          <h3 id={`${formId}-status`} className={SECTION_TITLE_CLASS}>
            {ARENA_STATUS_TEXTS.statusSection}
          </h3>
          <ResourceBar
            label={ARENA_CHANGE_TEXTS.health}
            tone="health"
            resource={health}
            onChange={setHealth}
            readOnly={!npc}
          />
          <ResourceBar
            label={ARENA_CHANGE_TEXTS.sanity}
            tone="sanity"
            resource={sanity}
            onChange={setSanity}
            readOnly={!npc}
          />
          {npc ? (
            <p className="font-sans text-sm text-muted-strong">{ARENA_STATUS_TEXTS.npcHint}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-sm text-muted-strong">
                {ARENA_STATUS_TEXTS.linked(target.token.name)}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={openSheet}
                icon={<Icon name="scroll-text" size={14} />}
              >
                {ARENA_STATUS_TEXTS.openSheet}
              </Button>
            </div>
          )}
        </section>
        <section aria-labelledby={`${formId}-viewers`} className={SECTION_CLASS}>
          <div className="grid gap-1">
            <h3 id={`${formId}-viewers`} className={SECTION_TITLE_CLASS}>
              {ARENA_STATUS_TEXTS.viewersSection}
            </h3>
            <p className="font-sans text-sm text-muted-strong">{ARENA_STATUS_TEXTS.viewersHint}</p>
          </div>
          <div className="border border-teal-500/30 bg-black/40 px-3">
            <Checkbox
              tone="teal"
              checked={everyone}
              onCheckedChange={setEveryone}
              label={ARENA_STATUS_TEXTS.everyone}
              className="min-h-11 w-full"
            />
          </div>
          {accountsStatus === "error" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-destructive/40 bg-black/40 px-3 py-2">
              <p role="alert" className="font-sans text-sm text-error">
                {ARENA_STATUS_TEXTS.accountsFailed}
              </p>
              <Button variant="ghost" size="sm" onClick={onRetryAccounts}>
                {ARENA_STATUS_TEXTS.retryAccounts}
              </Button>
            </div>
          ) : (
            <AccountChecklist
              accounts={accounts}
              selected={everyone ? accounts.map((account) => account.id) : viewerIds}
              onToggle={toggleViewer}
              legend={ARENA_STATUS_TEXTS.viewersSection}
              emptyLabel={ARENA_STATUS_TEXTS.noPlayers}
              disabled={everyone}
              loadingRows={
                accountsStatus === "loading" ? SETTINGS_ACCOUNT_SKELETON_ROWS : undefined
              }
            />
          )}
          {target.sheetLogins.length > 0 && (
            <p className="font-sans text-sm text-teal-200">
              {ARENA_STATUS_TEXTS.alwaysSee(target.sheetLogins.join(", "))}
            </p>
          )}
        </section>
        {error && (
          <p role="alert" className="font-sans text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
