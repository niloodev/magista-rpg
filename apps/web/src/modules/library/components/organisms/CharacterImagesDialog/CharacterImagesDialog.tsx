"use client";

import { toMediaUrl } from "@/core/services/http";
import { CHARACTER_IMAGE_FIELDS, TOKEN_STYLE_TEXTS } from "@/modules/library/library.constants";
import { Button, Checkbox, Icon } from "@/shared/components/atoms";
import { ImageField, Modal, TokenStyleChoice } from "@/shared/components/molecules";

import { useCharacterImagesDialog } from "./CharacterImagesDialog.hook";
import type { CharacterImagesDialogProps } from "./CharacterImagesDialog.types";

export function CharacterImagesDialog(props: CharacterImagesDialogProps) {
  const {
    formId,
    drafts,
    formError,
    pending,
    currentUrlOf,
    style,
    figureDisabled,
    onStyleChange,
    showName,
    onShowNameChange,
    isRemoved,
    onFileChange,
    onRemoveCurrent,
    onUndoRemove,
    submit,
  } = useCharacterImagesDialog(props);
  return (
    <Modal
      open
      onClose={props.onClose}
      title="Imagens"
      description={`Avatar, arte e token de ${props.characterName}.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            loading={pending}
            icon={<Icon name="check" size={14} />}
          >
            Salvar imagens
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={submit}
        className="grid grid-cols-[minmax(0,1fr)] gap-6"
      >
        {CHARACTER_IMAGE_FIELDS.map((field) => (
          <div key={field.kind} className="grid gap-2 border border-white/10 bg-black/30 p-4">
            <ImageField
              id={`${formId}-${field.kind}`}
              label={field.label}
              hint={field.hint}
              shape={field.shape}
              file={drafts[field.kind].file}
              currentUrl={toMediaUrl(currentUrlOf(field.kind))}
              error={drafts[field.kind].error}
              onFileChange={(file) => onFileChange(field.kind, file)}
              onRemoveCurrent={() => onRemoveCurrent(field.kind)}
              removed={isRemoved(field.kind)}
              onUndoRemove={() => onUndoRemove(field.kind)}
            />
            <p className="font-sans text-[13px] text-muted-strong">{field.description}</p>
          </div>
        ))}
        <div className="grid gap-4 border border-white/10 bg-black/30 p-4">
          <TokenStyleChoice
            id={`${formId}-style`}
            legend={TOKEN_STYLE_TEXTS.legend}
            value={style}
            onChange={onStyleChange}
            portraitUrl={toMediaUrl(currentUrlOf("avatar") ?? currentUrlOf("art"))}
            figureUrl={toMediaUrl(currentUrlOf("figure"))}
            figureDisabledReason={figureDisabled ? TOKEN_STYLE_TEXTS.needsFigure : null}
          />
          <div className="grid gap-1">
            <Checkbox
              checked={showName}
              onCheckedChange={onShowNameChange}
              label={TOKEN_STYLE_TEXTS.showName}
              className="min-h-11"
            />
            <p className="font-sans text-[13px] text-muted-strong">
              {TOKEN_STYLE_TEXTS.showNameHint}
            </p>
          </div>
        </div>
        {formError && (
          <p role="alert" className="font-sans text-[13px] font-semibold text-error">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
