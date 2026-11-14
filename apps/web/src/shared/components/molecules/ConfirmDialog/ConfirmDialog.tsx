"use client";

import { Button, Icon } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules/Modal";

import type { ConfirmDialogProps } from "./ConfirmDialog.types";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancel} data-autofocus>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            icon={<Icon name="trash-2" size={14} />}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="font-sans text-[15px] leading-relaxed text-muted-strong">{message}</p>
    </Modal>
  );
}
