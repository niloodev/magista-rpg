"use client";

import { ConfirmDialog } from "@/shared/components/molecules";

import { useLibraryDialogs } from "./LibraryDialogs.hook";
import type { LibraryDialogsProps } from "./LibraryDialogs.types";
import { AccessDialog, AccountsDialog, MoveDialog, NameDialog } from "./subcomponents";

export function LibraryDialogs(props: LibraryDialogsProps) {
  const {
    dialog,
    rows,
    accounts,
    allFolderOptions,
    moveOptions,
    characterNameMax,
    folderNameMax,
    submitName,
    submitMove,
    submitAccess,
    submitAccount,
    confirmDelete,
    deleteMessage,
    openAccounts,
    onClose,
  } = useLibraryDialogs(props);
  return (
    <>
      {dialog?.type === "createFolder" && (
        <NameDialog
          title="Nova pasta"
          label="Nome da pasta"
          submitLabel="Criar pasta"
          initialName=""
          maxLength={folderNameMax}
          onSubmit={submitName}
          onClose={onClose}
        />
      )}
      {dialog?.type === "renameFolder" && (
        <NameDialog
          title="Renomear pasta"
          label="Nome da pasta"
          submitLabel="Salvar"
          initialName={dialog.folder.name}
          maxLength={folderNameMax}
          onSubmit={submitName}
          onClose={onClose}
        />
      )}
      {dialog?.type === "createCharacter" && (
        <NameDialog
          title="Nova ficha"
          label="Nome do personagem"
          submitLabel="Criar ficha"
          initialName=""
          maxLength={characterNameMax}
          folderOptions={allFolderOptions}
          initialFolderId={dialog.folderId}
          onSubmit={submitName}
          onClose={onClose}
        />
      )}
      {dialog?.type === "renameCharacter" && (
        <NameDialog
          title="Renomear ficha"
          label="Nome do personagem"
          submitLabel="Salvar"
          initialName={dialog.character.name}
          maxLength={characterNameMax}
          onSubmit={submitName}
          onClose={onClose}
        />
      )}
      {dialog?.type === "move" && (
        <MoveDialog
          itemName={dialog.name}
          currentParentId={dialog.parentId}
          options={moveOptions}
          onSubmit={submitMove}
          onClose={onClose}
        />
      )}
      {dialog?.type === "access" && (
        <AccessDialog
          characterName={dialog.character.name}
          accounts={accounts}
          initialAccountIds={dialog.character.accountIds}
          onSubmit={submitAccess}
          onManageAccounts={openAccounts}
          onClose={onClose}
        />
      )}
      {dialog?.type === "accounts" && (
        <AccountsDialog rows={rows} onCreate={submitAccount} onClose={onClose} />
      )}
      <ConfirmDialog
        open={dialog?.type === "deleteFolder"}
        title="Excluir pasta"
        message={deleteMessage}
        confirmLabel="Excluir pasta"
        onConfirm={confirmDelete}
        onCancel={onClose}
      />
      <ConfirmDialog
        open={dialog?.type === "deleteCharacter"}
        title="Excluir ficha"
        message={deleteMessage}
        confirmLabel="Excluir ficha"
        onConfirm={confirmDelete}
        onCancel={onClose}
      />
    </>
  );
}
