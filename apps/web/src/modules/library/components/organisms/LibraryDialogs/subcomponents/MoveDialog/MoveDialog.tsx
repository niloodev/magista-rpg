"use client";

import { Button, Icon, Select } from "@/shared/components/atoms";
import { FormField, Modal } from "@/shared/components/molecules";

import { useMoveDialog } from "./MoveDialog.hook";
import type { MoveDialogProps } from "./MoveDialog.types";

export function MoveDialog({
  itemName,
  currentParentId,
  options,
  onSubmit,
  onClose,
}: MoveDialogProps) {
  const { formId, target, setTarget, error, pending, submit } = useMoveDialog({
    currentParentId,
    onSubmit,
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Mover ${itemName}`}
      description="Escolha a pasta de destino. O item vai para o fim da pasta."
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
            icon={<Icon name="folder-input" size={14} />}
          >
            Mover
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit}>
        <FormField id={`${formId}-target`} label="Destino" error={error ?? undefined}>
          <Select
            id={`${formId}-target`}
            value={target}
            onValueChange={setTarget}
            options={options}
          />
        </FormField>
      </form>
    </Modal>
  );
}
