"use client";

import {
  CHARACTER_NAME_MAX_LENGTH,
  FOLDER_NAME_MAX_LENGTH,
  isErrorResult,
  type ControllerResult,
  type FeatureKey,
  type ICreateAccountInput,
} from "@magista/shared";
import { useMemo } from "react";

import {
  createAccount,
  createCharacter,
  createFolder,
  deleteCharacter,
  deleteFolder,
  moveLibraryItem,
  renameCharacter,
  renameFolder,
  setCharacterAccess,
  setCharacterFeatures,
  setCharacterTokenSettings,
  uploadCharacterImage,
} from "@/modules/library/services";
import { CHARACTER_IMAGE_FIELDS } from "@/modules/library/library.constants";
import { useApp, useAppStoreApi } from "@/modules/shell/store";

import { CREATED_WITHOUT_IMAGES, MOVE_TO_END_INDEX } from "./LibraryDialogs.constants";
import type { LibraryDialogsProps } from "./LibraryDialogs.types";
import { accountRows, folderOptions } from "./LibraryDialogs.utils";
import type { INameDialogValues } from "./subcomponents";

/**
 * Wires every library dialog to its API call. Successful changes close the dialog and reload the
 * library; failures stay in the dialog (or become a notice for confirmations).
 */
export function useLibraryDialogs({
  dialog,
  onOpen,
  onClose,
  onChanged,
  onNotice,
  onExpandFolders,
}: LibraryDialogsProps) {
  const store = useAppStoreApi();
  const characters = useApp((state) => state.library.characters);
  const folders = useApp((state) => state.library.folders);
  const accounts = useApp((state) => state.library.accounts);

  const allFolderOptions = useMemo(() => folderOptions(folders), [folders]);
  const moveOptions = useMemo(
    () =>
      dialog?.type === "move" && dialog.item.kind === "folder"
        ? folderOptions(folders, dialog.item.id)
        : allFolderOptions,
    [dialog, folders, allFolderOptions],
  );
  const rows = useMemo(() => accountRows(accounts, characters), [accounts, characters]);

  const finish = async <T>(request: Promise<ControllerResult<T>>): Promise<string | null> => {
    const result = await request;
    if (isErrorResult(result)) return result.error;
    onClose();
    onNotice(result.message);
    await onChanged();
    return null;
  };

  const expand = (folderId: string | null) => {
    if (folderId) onExpandFolders([folderId]);
  };

  const createWithImages = async (
    name: string,
    folderId: string | null,
    images: INameDialogValues["images"],
  ): Promise<string | null> => {
    const created = await createCharacter({ name, folderId });
    if (isErrorResult(created)) return created.error;
    const failures: string[] = [];
    for (const field of CHARACTER_IMAGE_FIELDS) {
      const file = images[field.kind];
      if (!file) continue;
      const uploaded = await uploadCharacterImage(created.payload.id, field.kind, file);
      if (isErrorResult(uploaded)) failures.push(`${field.label}: ${uploaded.error}`);
      else if (field.kind === "figure")
        await setCharacterTokenSettings(created.payload.id, { style: "figure" });
    }
    const failure = failures.length > 0 ? failures.join(" ") : null;
    await onChanged();
    if (failure) {
      const character = store
        .getState()
        .library.characters.find((c) => c.id === created.payload.id);
      onOpen({
        type: "images",
        character: character ?? created.payload,
        error: `${CREATED_WITHOUT_IMAGES} ${failure}`,
      });
      return null;
    }
    onClose();
    onNotice(created.message);
    return null;
  };

  const submitName = ({ name, folderId, images }: INameDialogValues) => {
    if (dialog?.type === "createFolder") {
      expand(dialog.parentId);
      return finish(createFolder({ name, parentId: dialog.parentId }));
    }
    if (dialog?.type === "renameFolder") return finish(renameFolder(dialog.folder.id, name));
    if (dialog?.type === "createCharacter") {
      expand(folderId);
      return createWithImages(name, folderId, images);
    }
    if (dialog?.type === "renameCharacter")
      return finish(renameCharacter(dialog.character.id, name));
    return Promise.resolve(null);
  };

  const submitMove = (parentId: string | null) => {
    expand(parentId);
    return dialog?.type === "move"
      ? finish(
          moveLibraryItem({
            kind: dialog.item.kind,
            id: dialog.item.id,
            parentId,
            index: MOVE_TO_END_INDEX,
          }),
        )
      : Promise.resolve(null);
  };

  const submitAccess = (accountIds: string[]) =>
    dialog?.type === "access"
      ? finish(setCharacterAccess(dialog.character.id, accountIds))
      : Promise.resolve(null);

  const submitFeatures = (features: FeatureKey[]) =>
    dialog?.type === "features"
      ? finish(setCharacterFeatures(dialog.character.id, features))
      : Promise.resolve(null);

  const submitAccount = async (input: ICreateAccountInput) => {
    const result = await createAccount(input);
    if (isErrorResult(result)) return { error: result.error };
    await onChanged();
    return { created: result.payload };
  };

  const confirmDelete = async () => {
    const request =
      dialog?.type === "deleteFolder"
        ? deleteFolder(dialog.folder.id)
        : dialog?.type === "deleteCharacter"
          ? deleteCharacter(dialog.character.id)
          : null;
    if (!request) return;
    const failure = await finish(request);
    if (failure) {
      onClose();
      onNotice(failure);
    }
  };

  const deleteMessage =
    dialog?.type === "deleteFolder"
      ? `Excluir a pasta "${dialog.folder.name}"? As fichas e subpastas dela vão para a pasta acima.`
      : dialog?.type === "deleteCharacter"
        ? `Excluir a ficha de ${dialog.character.name}? Isso apaga a ficha para sempre e não pode ser desfeito.`
        : "";

  return {
    dialog,
    rows,
    accounts,
    allFolderOptions,
    moveOptions,
    characterNameMax: CHARACTER_NAME_MAX_LENGTH,
    folderNameMax: FOLDER_NAME_MAX_LENGTH,
    submitName,
    submitMove,
    submitAccess,
    submitFeatures,
    submitAccount,
    confirmDelete,
    deleteMessage,
    openAccounts: () => onOpen({ type: "accounts" }),
    onNotice,
    onClose,
  };
}
