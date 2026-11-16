"use client";

import { ARENA_NAME_MAX_LENGTH } from "@magista/shared";

import { ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { Button, Icon, Input } from "@/shared/components/atoms";
import { FormField, ImageField, Modal, TokenStyleChoice } from "@/shared/components/molecules";

import { useNpcTokenDialog } from "./NpcTokenDialog.hook";
import type { NpcTokenDialogProps } from "./NpcTokenDialog.types";

/**
 * "Token avulso": a GM token without a sheet (NPC, monster, object), with a name and an optional image, placed
 * at the center of the view.
 */
export function NpcTokenDialog({ onSubmit, onClose }: NpcTokenDialogProps) {
  const {
    formId,
    name,
    file,
    style,
    preview,
    onStyleChange,
    nameError,
    imageError,
    formError,
    pending,
    onNameChange,
    onFileChange,
    submit,
  } = useNpcTokenDialog({ onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={ARENA_PLACEMENT_TEXTS.npcTitle}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ARENA_PLACEMENT_TEXTS.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            icon={<Icon name="check" size={14} />}
          >
            {ARENA_PLACEMENT_TEXTS.npcSubmit}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="grid grid-cols-[minmax(0,1fr)] gap-5"
      >
        <p className="font-sans text-[15px] text-muted-strong">{ARENA_PLACEMENT_TEXTS.npcHelp}</p>
        <FormField
          id={`${formId}-name`}
          label={ARENA_PLACEMENT_TEXTS.npcName}
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
          label={ARENA_PLACEMENT_TEXTS.npcImage}
          hint={
            style === "figure"
              ? ARENA_PLACEMENT_TEXTS.figureImageHint
              : ARENA_PLACEMENT_TEXTS.npcImageHint
          }
          shape={style === "figure" ? "figure" : "circle"}
          file={file}
          currentUrl={null}
          error={imageError}
          onFileChange={onFileChange}
          onRemoveCurrent={() => onFileChange(null)}
        />
        <TokenStyleChoice
          id={`${formId}-style`}
          legend={ARENA_PLACEMENT_TEXTS.styleLegend}
          value={style}
          onChange={onStyleChange}
          portraitUrl={preview}
          figureUrl={preview}
          figureDisabledReason={file ? null : ARENA_PLACEMENT_TEXTS.styleNeedsImage}
        />
        {formError && (
          <p
            role="alert"
            className="border-l-2 border-destructive bg-black/40 px-3 py-2 font-sans text-sm text-error"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
