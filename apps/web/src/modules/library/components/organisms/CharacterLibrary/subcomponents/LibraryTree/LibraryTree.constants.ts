import type { ITreeDragState } from "./LibraryTree.types";

export const IDLE_TREE_DRAG: ITreeDragState = {
  activeId: null,
  keyboard: false,
  excluded: [],
  target: null,
};

export const POINTER_ACTIVATION_DISTANCE = 6;

export const TREE_INSTRUCTIONS =
  "Para mover, foque a alça e pressione espaço ou Enter. Use as setas para cima e para baixo: no meio de uma pasta o item entra nela, nas bordas fica antes ou depois. Pressione espaço ou Enter para soltar e Esc para cancelar.";

export const POSITION_LABELS = {
  before: "antes de",
  after: "depois de",
  inside: "dentro de",
} as const;

export const POST_DROP_CLICK_GUARD_MS = 50;

export const EMPTY_LIBRARY_TEXT = "Nenhuma ficha ainda.";
