"use client";

import {
  ARENA_INITIATIVE_BONUS_MAX,
  ARENA_INITIATIVE_BONUS_MIN,
  ARENA_NAME_MAX_LENGTH,
} from "@magista/shared";

import {
  ARENA_CHANGE_TEXTS,
  ARENA_PLACEMENT_TEXTS,
  ARENA_STATUS_TEXTS,
} from "@/modules/arena/arena.constants";
import { ResourceBar } from "@/modules/sheet/components/molecules";
import { Button, Checkbox, Icon, Input } from "@/shared/components/atoms";
import {
  AccountChecklist,
  FormField,
  ImageField,
  Modal,
  NumberField,
  TokenStyleChoice,
} from "@/shared/components/molecules";

import {
  SECTION_CLASS,
  SECTION_TITLE_CLASS,
  SETTINGS_ACCOUNT_SKELETON_ROWS,
} from "./ArenaTokenSettingsDialog.constants";
import { useArenaTokenSettingsDialog } from "./ArenaTokenSettingsDialog.hook";
import type { ArenaTokenSettingsDialogProps } from "./ArenaTokenSettingsDialog.types";

/**
 * Settings of one token (GM): name, image and style (NPC), whether the name shows on the map, its health and sanity (own values for an NPC, the sheet ones for a character
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
    canPickStyle,
    style,
    setStyle,
    name,
    nameError,
    onNameChange,
    showName,
    setShowName,
    initiativeBonus,
    setInitiativeBonus,
    file,
    imageRemoved,
    imageError,
    currentImageUrl,
    styleImageUrl,
    onFileChange,
    onRemoveImage,
    onUndoRemoveImage,
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
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="grid grid-cols-[minmax(0,1fr)] gap-4"
      >
        <section aria-labelledby={`${formId}-token`} className={SECTION_CLASS}>
          <h3 id={`${formId}-token`} className={SECTION_TITLE_CLASS}>
            {ARENA_STATUS_TEXTS.tokenSection}
          </h3>
          {npc && (
            <>
              <FormField
                id={`${formId}-name`}
                label={ARENA_STATUS_TEXTS.name}
                error={nameError ?? undefined}
              >
                <Input
                  id={`${formId}-name`}
                  value={name}
                  maxLength={ARENA_NAME_MAX_LENGTH}
                  autoComplete="off"
                  invalid={Boolean(nameError)}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </FormField>
              <ImageField
                id={`${formId}-image`}
                label={ARENA_STATUS_TEXTS.image}
                hint={
                  style === "figure"
                    ? ARENA_PLACEMENT_TEXTS.figureImageHint
                    : ARENA_PLACEMENT_TEXTS.npcImageHint
                }
                shape={style === "figure" ? "figure" : "circle"}
                file={file}
                currentUrl={currentImageUrl}
                removed={imageRemoved}
                error={imageError}
                onFileChange={onFileChange}
                onRemoveCurrent={onRemoveImage}
                onUndoRemove={onUndoRemoveImage}
              />
              <TokenStyleChoice
                id={`${formId}-style`}
                legend={ARENA_PLACEMENT_TEXTS.styleLegend}
                value={style}
                onChange={setStyle}
                portraitUrl={styleImageUrl}
                figureUrl={styleImageUrl}
                figureDisabledReason={canPickStyle ? null : ARENA_PLACEMENT_TEXTS.styleNeedsImage}
              />
              <FormField
                id={`${formId}-initiative`}
                label={ARENA_STATUS_TEXTS.initiativeBonus}
                hint={ARENA_STATUS_TEXTS.initiativeBonusHint}
              >
                <NumberField
                  id={`${formId}-initiative`}
                  value={initiativeBonus}
                  onValueChange={setInitiativeBonus}
                  min={ARENA_INITIATIVE_BONUS_MIN}
                  max={ARENA_INITIATIVE_BONUS_MAX}
                  className="max-w-28"
                />
              </FormField>
            </>
          )}
          <div className="grid gap-1">
            <Checkbox
              checked={showName}
              onCheckedChange={setShowName}
              label={ARENA_STATUS_TEXTS.showName}
              className="min-h-11"
            />
            <p className="font-sans text-sm text-muted-strong">{ARENA_STATUS_TEXTS.showNameHint}</p>
          </div>
        </section>
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
