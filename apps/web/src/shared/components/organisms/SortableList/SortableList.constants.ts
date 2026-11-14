import type { Modifier } from "@dnd-kit/core";

export const SORTABLE_INSTRUCTIONS =
  "Para reordenar, foque a alça e pressione espaço ou Enter. Use as setas para cima e para baixo e pressione espaço ou Enter de novo para soltar. Esc cancela.";

export const POINTER_DISTANCE = 4;

export const lockToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
