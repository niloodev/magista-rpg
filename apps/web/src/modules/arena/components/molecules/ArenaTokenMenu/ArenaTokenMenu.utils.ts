import type { IArenaPoint } from "@magista/shared";

import { TOKEN_MENU_GUTTER_PX } from "./ArenaTokenMenu.constants";

/**
 * Top-left corner of a menu opened at `anchor`: to the right and below it, flipped to the other side when it
 * would leave the window, never past the gutter.
 */
export function menuPosition(
  anchor: IArenaPoint,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): IArenaPoint {
  const fitsRight = anchor.x + size.width + TOKEN_MENU_GUTTER_PX <= viewport.width;
  const fitsBelow = anchor.y + size.height + TOKEN_MENU_GUTTER_PX <= viewport.height;
  const x = fitsRight ? anchor.x : anchor.x - size.width;
  const y = fitsBelow ? anchor.y : anchor.y - size.height;
  const maxX = viewport.width - size.width - TOKEN_MENU_GUTTER_PX;
  const maxY = viewport.height - size.height - TOKEN_MENU_GUTTER_PX;
  return {
    x: Math.max(TOKEN_MENU_GUTTER_PX, Math.min(x, maxX)),
    y: Math.max(TOKEN_MENU_GUTTER_PX, Math.min(y, maxY)),
  };
}
