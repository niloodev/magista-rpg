import type { CSSProperties } from "react";

import { ARENA_FIT_PADDING } from "@/modules/arena/services/arenaRenderer/arenaRenderer.constants";

/**
 * Side paddings that match the fitted camera when side panels are open (the default classes cover the rest).
 */
export function placeholderInsets(insetLeft: number, insetRight: number): CSSProperties {
  return {
    ...(insetLeft > 0 ? { paddingLeft: insetLeft + ARENA_FIT_PADDING } : {}),
    ...(insetRight > 0 ? { paddingRight: insetRight + ARENA_FIT_PADDING } : {}),
  };
}
