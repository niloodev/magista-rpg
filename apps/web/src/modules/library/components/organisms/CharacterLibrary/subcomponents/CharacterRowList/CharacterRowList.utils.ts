import type { DragEvent } from "react";

import { CHARACTER_DRAG_TYPE } from "@/modules/library/library.constants";

/**
 * Starts the native drag of a sheet row: the sheet id travels under `CHARACTER_DRAG_TYPE`.
 */
export function startCharacterDrag(event: DragEvent<HTMLElement>, characterId: string): void {
  event.dataTransfer.setData(CHARACTER_DRAG_TYPE, characterId);
  event.dataTransfer.effectAllowed = "copy";
}
