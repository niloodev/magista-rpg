import { ARENA_BOARD_MAX_SIDE, ARENA_BOARD_MIN_SIDE, ARENA_UNIT_PX } from "@magista/shared";

import type { IBoardDraft } from "./SceneBoardDialog.types";

/** Board units shown with up to two decimals and a comma ("58,51"). */
export function formatUnits(px: number): string {
  return (Math.round((px / ARENA_UNIT_PX) * 100) / 100).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}

/** Pixels of a typed number of units, or null when it is not a positive number. */
export function parseUnits(text: string): number | null {
  const value = Number.parseFloat(text.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value * ARENA_UNIT_PX : null;
}

/** True when a side in pixels is within the board limits. */
export function isBoardSide(px: number | null): px is number {
  return px !== null && px >= ARENA_BOARD_MIN_SIDE && px <= ARENA_BOARD_MAX_SIDE;
}

/**
 * The draft after one field changed: with a map ratio (height / width) the other field follows it.
 */
export function followRatio(
  draft: IBoardDraft,
  field: keyof IBoardDraft,
  text: string,
  ratio: number | null,
): IBoardDraft {
  const next = { ...draft, [field]: text };
  const px = parseUnits(text);
  if (ratio === null || px === null) return next;
  return field === "width"
    ? { width: text, height: formatUnits(px * ratio) }
    : { width: formatUnits(px / ratio), height: text };
}
