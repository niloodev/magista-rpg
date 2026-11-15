import type { IWindowRect, IWindowSize } from "./FloatingWindow.types";

/**
 * Keeps a window inside the viewport: never smaller than `min` (nor larger than the viewport) and with every
 * edge on screen.
 */
export function clampWindowRect(
  rect: IWindowRect,
  viewport: IWindowSize,
  min: IWindowSize,
  minTop = 0,
): IWindowRect {
  const width = Math.round(Math.min(Math.max(rect.width, min.width), viewport.width));
  const height = Math.round(
    Math.min(Math.max(rect.height, min.height), Math.max(viewport.height - minTop, min.height)),
  );
  return {
    width,
    height,
    x: Math.round(Math.min(Math.max(rect.x, 0), Math.max(viewport.width - width, 0))),
    y: Math.round(Math.min(Math.max(rect.y, minTop), Math.max(viewport.height - height, minTop))),
  };
}

/**
 * The rect after a pointer gesture: moving shifts the corner, resizing grows from the top left corner.
 */
export function gestureRect(
  start: IWindowRect,
  mode: "move" | "resize",
  dx: number,
  dy: number,
): IWindowRect {
  return mode === "move"
    ? { ...start, x: start.x + dx, y: start.y + dy }
    : { ...start, width: start.width + dx, height: start.height + dy };
}

/**
 * Keyboard gesture: Alt+arrows move the window, Alt+Shift+arrows resize it (null for any other key).
 */
export function keyGesture(
  key: string,
  shift: boolean,
  step: number,
): { mode: "move" | "resize"; dx: number; dy: number } | null {
  const deltas: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  const delta = deltas[key];
  if (!delta) return null;
  return { mode: shift ? "resize" : "move", dx: delta[0], dy: delta[1] };
}
