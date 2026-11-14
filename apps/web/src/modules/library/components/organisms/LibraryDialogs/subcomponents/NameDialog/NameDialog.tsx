"use client";

import { Button, Icon, Input, Select } from "@/shared/components/atoms";
import { FormField, Modal } from "@/shared/components/molecules";

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
  onSubmit,
  onClose,
}: NameDialogProps) {
  const { formId, name, folderValue, error, pending, onNameChange, setFolderValue, submit } =
    useNameDialog({ initialName, initialFolderId, onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="sm"
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
      </form>
    </Modal>
  );
}
