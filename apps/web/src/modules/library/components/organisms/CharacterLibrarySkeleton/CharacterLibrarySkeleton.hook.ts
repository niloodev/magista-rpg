"use client";

import { useLibraryShapeHint } from "@/modules/library/hooks";
import { LIBRARY_TITLES } from "@/modules/library/library.constants";
import { countLabel } from "@/modules/library/library.utils";

import type { CharacterLibrarySkeletonProps } from "./CharacterLibrarySkeleton.types";

/**
 * Rows to draw while the session loads (shape of the last library on this device), the real panel title
 * when the role is known, and a sample of the sheet counter for its width.
 */
export function useCharacterLibrarySkeleton({
  known = false,
  gm = false,
}: CharacterLibrarySkeletonProps) {
  const shape = useLibraryShapeHint();
  const rows = gm ? shape.tree.length : shape.list.length;
  return {
    shape,
    title: known ? (gm ? LIBRARY_TITLES.gm : LIBRARY_TITLES.player) : null,
    titleSample: LIBRARY_TITLES.player,
    countSample: countLabel(Math.max(rows, 1), "ficha", "fichas"),
  };
}
