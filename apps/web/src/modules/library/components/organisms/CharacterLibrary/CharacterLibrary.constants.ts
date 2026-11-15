import type { IFolderTreeLabels } from "@/modules/library/components/organisms/FolderTree";
import { EMPTY_FOLDER_TEXT, ROOT_FOLDER_LABEL } from "@/modules/library/library.constants";

export const NOTICE_TIMEOUT_MS = 4000;

export const EMPTY_PLAYER_TEXT = "Nenhuma ficha liberada para esta conta. Fale com o Mestre.";

export const EMPTY_SEARCH_TEXT = "Nenhuma ficha com esse nome.";

export const NOTICE_CLASSES = {
  visible:
    "-mt-3 border-l-2 border-primary bg-black/40 px-3 py-2 font-sans text-sm text-accent-text",
  hidden: "sr-only",
} as const;

export const EMPTY_LIBRARY_TEXT = "Nenhuma ficha ainda.";

export const CHARACTER_TREE_LABELS: IFolderTreeLabels = {
  list: "Pastas e fichas",
  rootIdle: ROOT_FOLDER_LABEL,
  rootDragging: "Solte aqui para tirar da pasta (raiz)",
  emptyFolder: EMPTY_FOLDER_TEXT,
  moveFolder: (name) => `Mover pasta ${name}`,
  moveLeaf: (name) => `Mover ficha ${name}`,
  folderActions: (name) => `Ações da pasta ${name}`,
};
