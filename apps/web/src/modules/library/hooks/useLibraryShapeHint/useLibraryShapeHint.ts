"use client";

import { useMemo } from "react";

import { DEFAULT_LIBRARY_SHAPE, LIBRARY_SHAPE_HINT_KEY } from "@/modules/library/library.constants";
import type { ILibraryShape } from "@/modules/library/library.types";
import { parseLibraryShape } from "@/modules/library/library.utils";
import { useSkeletonHint } from "@/modules/shell/providers";

/**
 * Rows of the last library loaded on this device (from the skeleton hints cookie, so the server renders the
 * same rows). Falls back to a small default on first visit or when the hint is unreadable.
 */
export function useLibraryShapeHint(): ILibraryShape {
  const raw = useSkeletonHint(LIBRARY_SHAPE_HINT_KEY);
  return useMemo(() => {
    const shape = parseLibraryShape(raw);
    return shape && (shape.tree.length > 0 || shape.list.length > 0)
      ? shape
      : DEFAULT_LIBRARY_SHAPE;
  }, [raw]);
}
