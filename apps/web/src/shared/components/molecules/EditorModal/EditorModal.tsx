"use client";

import { Button, Icon } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules/Modal";

import type { EditorModalProps } from "./EditorModal.types";

export function EditorModal({
  open,
  mode,
  entityLabel,
  formId,
  size = "md",
  onClose,
  onDelete,
  children,
}: EditorModalProps) {
  const creating = mode === "create";
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      title={creating ? `Adicionar ${entityLabel}` : `Editar ${entityLabel}`}
      description="As alterações só são aplicadas ao salvar."
      footer={
        <>
          {!creating && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              icon={<Icon name="trash-2" size={14} />}
              className="mr-auto"
            >
              Excluir
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            icon={<Icon name="check" size={14} />}
          >
            {creating ? "Adicionar" : "Salvar"}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
