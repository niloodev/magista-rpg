import {
  buildFolderTree,
  flattenFolderTree,
  isSameOrDescendant,
  type IAccount,
  type ICharacterSummary,
  type IFolder,
} from "@magista/shared";

import { ROOT_FOLDER_LABEL } from "@/modules/library/library.constants";
import { countLabel } from "@/modules/library/library.utils";
import type { SelectOption } from "@/shared/components/atoms";

import { FOLDER_INDENT } from "./LibraryDialogs.constants";
import type { IAccountRow } from "./subcomponents";

/**
 * Folder choices for selects, indented by depth, starting with the root. When `movingFolderId` is
 * given, that folder and its descendants are left out (a folder cannot go inside itself).
 */
export function folderOptions(folders: IFolder[], movingFolderId?: string): SelectOption[] {
  const nodes = flattenFolderTree(buildFolderTree(folders)).filter(
    (node) => !movingFolderId || !isSameOrDescendant(folders, node.id, movingFolderId),
  );
  return [
    { value: "", label: ROOT_FOLDER_LABEL },
    ...nodes.map((node) => ({
      value: node.id,
      label: `${FOLDER_INDENT.repeat(node.depth + 1)}${node.name}`,
    })),
  ];
}

/**
 * Account list rows with how many characters each player can open.
 */
export function accountRows(accounts: IAccount[], characters: ICharacterSummary[]): IAccountRow[] {
  return accounts.map((account) => {
    const isGm = account.role === "GM";
    const count = characters.filter((character) =>
      character.accountIds.includes(account.id),
    ).length;
    return {
      account,
      isGm,
      countLabel: isGm ? "Mestre" : countLabel(count, "ficha", "fichas"),
    };
  });
}
