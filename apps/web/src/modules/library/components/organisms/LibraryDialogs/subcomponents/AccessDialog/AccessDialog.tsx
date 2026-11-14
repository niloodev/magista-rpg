"use client";

import { Button, Checkbox, Icon, Input } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

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
  const {
    formId,
    players,
    selected,
    selectionLabel,
    filter,
    setFilter,
    toggle,
    error,
    pending,
    submit,
  } = useAccessDialog({ accounts, initialAccountIds, onSubmit });
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
        <Input
          type="search"
          aria-label="Filtrar contas"
          placeholder="Filtrar contas..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <fieldset className="grid gap-1">
          <legend className="sr-only">Contas de jogador</legend>
          {players.length === 0 && (
            <p className="py-3 font-sans text-sm text-muted-strong">
              Nenhuma conta de jogador encontrada.
            </p>
          )}
          {players.map((account) => (
            <div
              key={account.id}
              className="border border-white/5 bg-black/30 px-3 transition-colors hover:border-teal-500/40"
            >
              <Checkbox
                tone="teal"
                checked={selected.includes(account.id)}
                onCheckedChange={(checked) => toggle(account.id, checked)}
                label={account.login}
                className="min-h-11 w-full"
              />
            </div>
          ))}
        </fieldset>
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
