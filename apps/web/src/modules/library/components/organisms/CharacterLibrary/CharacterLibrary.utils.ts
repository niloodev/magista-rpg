import type { ICharacterSummary, IFolder } from "@magista/shared";

import type { LibraryDialog } from "@/modules/library/library.types";
import { countLabel } from "@/modules/library/library.utils";
import type { ActionMenuItem } from "@/shared/components/molecules";

/**
 * "3 fichas" / "1 ficha" / "Nenhuma ficha".
 */
export function characterCountLabel(count: number): string {
  return count === 0 ? "Nenhuma ficha" : countLabel(count, "ficha", "fichas");
}

/**
 * True when a keyboard event comes from a place where "/" should be typed, not used as a shortcut.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.closest("dialog[open]") !== null
  );
}

/**
 * Actions of the GM menu on a character card.
 */
export function characterMenu(
  character: ICharacterSummary,
  open: (dialog: LibraryDialog) => void,
): ActionMenuItem[] {
  return [
    {
      label: "Acesso de jogadores",
      icon: "key-round",
      onSelect: () => open({ type: "access", character }),
    },
    {
      label: "Renomear",
      icon: "pen-line",
      onSelect: () => open({ type: "renameCharacter", character }),
    },
    {
      label: "Mover para...",
      icon: "folder-input",
      onSelect: () =>
        open({
          type: "move",
          item: { kind: "character", id: character.id },
          name: character.name,
          parentId: character.folderId,
        }),
    },
    {
      label: "Excluir",
      icon: "trash-2",
      destructive: true,
      onSelect: () => open({ type: "deleteCharacter", character }),
    },
  ];
}

/**
 * Actions of the GM menu on a folder tile.
 */
export function folderMenu(
  folder: IFolder,
  open: (dialog: LibraryDialog) => void,
): ActionMenuItem[] {
  return [
    {
      label: "Nova ficha aqui",
      icon: "file-plus",
      onSelect: () => open({ type: "createCharacter", folderId: folder.id }),
    },
    {
      label: "Nova subpasta",
      icon: "folder-plus",
      onSelect: () => open({ type: "createFolder", parentId: folder.id }),
    },
    { label: "Renomear", icon: "pen-line", onSelect: () => open({ type: "renameFolder", folder }) },
    {
      label: "Mover para...",
      icon: "folder-input",
      onSelect: () =>
        open({
          type: "move",
          item: { kind: "folder", id: folder.id },
          name: folder.name,
          parentId: folder.parentId,
        }),
    },
    {
      label: "Excluir",
      icon: "trash-2",
      destructive: true,
      onSelect: () => open({ type: "deleteFolder", folder }),
    },
  ];
}

/**
 * Logins of the accounts that can open a character, in the order access was granted.
 */
export function accessLabels(character: ICharacterSummary, logins: Map<string, string>): string[] {
  return character.accountIds
    .map((id) => logins.get(id))
    .filter((login): login is string => Boolean(login));
}
