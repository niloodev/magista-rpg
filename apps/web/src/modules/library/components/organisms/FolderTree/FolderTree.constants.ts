import { lockToVerticalAxis } from "@/shared/components/organisms";

import type { ITreeDragState } from "./FolderTree.types";
import { treeKeyboardCoordinates } from "./FolderTree.utils";

export const IDLE_TREE_DRAG: ITreeDragState = {
  activeId: null,
  keyboard: false,
  excluded: new Set<string>(),
  target: null,
};

export const POINTER_ACTIVATION_DISTANCE = 6;

/** Sensor options kept stable, so the sensors (and every row's listeners) are not rebuilt on each render. */
export const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE },
};

export const KEYBOARD_SENSOR_OPTIONS = { coordinateGetter: treeKeyboardCoordinates };

/** Drag modifiers: locked to the list's vertical axis, or free to leave it (drop on the Arena map). */
export const VERTICAL_AXIS = [lockToVerticalAxis];

export const FREE_AXIS = [];

export const TREE_INSTRUCTIONS =
  "Para mover, foque a alça e pressione espaço ou Enter. Use as setas para cima e para baixo: no meio de uma pasta o item entra nela, nas bordas fica antes ou depois. Pressione espaço ou Enter para soltar e Esc para cancelar.";

export const POSITION_LABELS = {
  before: "antes de",
  after: "depois de",
  inside: "dentro de",
} as const;

export const POST_DROP_CLICK_GUARD_MS = 50;
