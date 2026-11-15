"use client";

import { toMediaUrl } from "@/core/services/http";
import { CHARACTER_IMAGE_FIELDS } from "@/modules/library/library.constants";
import { Button, Icon } from "@/shared/components/atoms";
import { ImageField, IMAGE_HINT, Modal } from "@/shared/components/molecules";

import { useCharacterImagesDialog } from "./CharacterImagesDialog.hook";
import type { CharacterImagesDialogProps } from "./CharacterImagesDialog.types";

export function CharacterImagesDialog(props: CharacterImagesDialogProps) {
  const {
    formId,
    drafts,
    formError,
    pending,
    currentUrlOf,
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
      description={`Avatar e arte de ${props.characterName}.`}
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
      <form id={formId} noValidate onSubmit={submit} className="grid gap-6">
        {CHARACTER_IMAGE_FIELDS.map((field) => (
          <div key={field.kind} className="grid gap-2 border border-white/10 bg-black/30 p-4">
            <ImageField
              id={`${formId}-${field.kind}`}
              label={field.label}
              hint={IMAGE_HINT}
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
        {formError && (
          <p role="alert" className="font-sans text-[13px] font-semibold text-error">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
