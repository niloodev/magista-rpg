"use client";

import { useCallback } from "react";

import type { ArenaDockedSheetProps } from "./ArenaDockedSheet.types";

/**
 * Binds the dock actions to this sheet (stable while the callbacks are).
 */
export function useArenaDockedSheet({
  characterId,
  onUndock,
  onClose,
}: Pick<ArenaDockedSheetProps, "characterId" | "onUndock" | "onClose">) {
  const undock = useCallback(() => onUndock(characterId), [onUndock, characterId]);
  const close = useCallback(() => onClose(characterId), [onClose, characterId]);
  return { undock, close };
}
