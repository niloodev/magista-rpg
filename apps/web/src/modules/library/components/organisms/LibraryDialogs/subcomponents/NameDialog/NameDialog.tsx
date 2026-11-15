"use client";

import { CHARACTER_IMAGE_FIELDS } from "@/modules/library/library.constants";
import { Button, Icon, Input, Select } from "@/shared/components/atoms";
import { FormField, IMAGE_HINT, ImageField, Modal } from "@/shared/components/molecules";

import { useNameDialog } from "./NameDialog.hook";
import type { NameDialogProps } from "./NameDialog.types";

export function NameDialog({
  title,
  label,
  submitLabel,
  initialName,
  maxLength,
  folderOptions,
  initialFolderId,
  withImages = false,
  onSubmit,
  onClose,
}: NameDialogProps) {
  const {
    formId,
    name,
    folderValue,
    error,
    pending,
    images,
    imageErrors,
    onNameChange,
    onImageChange,
    setFolderValue,
    submit,
  } = useNameDialog({ initialName, initialFolderId, onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size={withImages ? "md" : "sm"}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
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
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-5">
        <FormField id={`${formId}-name`} label={label} error={error ?? undefined}>
          <Input
            id={`${formId}-name`}
            value={name}
            maxLength={maxLength}
            autoComplete="off"
            invalid={Boolean(error)}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </FormField>
        {folderOptions && (
          <FormField id={`${formId}-folder`} label="Pasta">
            <Select
              id={`${formId}-folder`}
              value={folderValue}
              onValueChange={setFolderValue}
              options={folderOptions}
            />
          </FormField>
        )}
        {withImages &&
          CHARACTER_IMAGE_FIELDS.map((field) => (
            <ImageField
              key={field.kind}
              id={`${formId}-${field.kind}`}
              label={field.label}
              hint={IMAGE_HINT}
              shape={field.shape}
              file={images[field.kind]}
              currentUrl={null}
              error={imageErrors[field.kind]}
              onFileChange={(file) => onImageChange(field.kind, file)}
              onRemoveCurrent={() => onImageChange(field.kind, null)}
            />
          ))}
      </form>
    </Modal>
  );
}
