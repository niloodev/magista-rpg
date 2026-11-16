"use client";

import { Button, Icon } from "@/shared/components/atoms";
import { AccountChecklist, Modal } from "@/shared/components/molecules";

import { useAccessDialog } from "./AccessDialog.hook";
import type { AccessDialogProps } from "./AccessDialog.types";

export function AccessDialog({
  characterName,
  accounts,
  initialAccountIds,
  onSubmit,
  onManageAccounts,
  onClose,
}: AccessDialogProps) {
  const { formId, players, selected, selectionLabel, toggle, error, pending, submit } =
    useAccessDialog({ accounts, initialAccountIds, onSubmit });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Acesso a ${characterName}`}
      description="Marque as contas de jogador que podem abrir, editar e rolar com esta ficha."
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageAccounts}
            icon={<Icon name="user-plus" size={14} />}
            className="mr-auto"
          >
            Contas
          </Button>
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
            Salvar acesso
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="grid gap-4">
        <AccountChecklist
          accounts={players}
          selected={selected}
          onToggle={toggle}
          legend="Contas de jogador"
          emptyLabel="Nenhuma conta de jogador encontrada."
        />
        <p aria-live="polite" className="font-sans text-sm text-muted-strong">
          {selectionLabel}
        </p>
        {error && (
          <p role="alert" className="font-sans text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
