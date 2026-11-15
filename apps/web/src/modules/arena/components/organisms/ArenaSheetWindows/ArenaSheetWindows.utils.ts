import { ARENA_SHEET_WINDOW_LAYOUT } from "@/modules/arena/arena.constants";
import { clampWindowRect, WINDOW_MIN_SIZE, type IWindowRect } from "@/shared/components/organisms";

/**
 * Default rect of the n-th window: between the side panels (never narrower than the minimum), below the top
 * bar, cascading.
 */
export function defaultSheetWindowRect(
  index: number,
  panels: { left: number; right: number },
  viewport: { width: number; height: number },
): IWindowRect {
  const { gap, top, minTop, cascade, width, bottomGap } = ARENA_SHEET_WINDOW_LAYOUT;
  const x = panels.left + gap + index * cascade;
  const y = top + index * cascade;
  return clampWindowRect(
    {
      x,
      y,
      width: Math.min(width, viewport.width - x - panels.right - gap),
      height: viewport.height - y - bottomGap,
    },
    viewport,
    WINDOW_MIN_SIZE,
    minTop,
  );
}

/**
 * Reads a window rect saved on this device, ignoring anything malformed.
 */
export function parseSheetWindowRect(raw: string | null): IWindowRect | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const { x, y, width, height } = value as Record<string, unknown>;
    const numbers = [x, y, width, height];
    if (!numbers.every((item) => typeof item === "number" && Number.isFinite(item))) return null;
    return { x: x as number, y: y as number, width: width as number, height: height as number };
  } catch {
    return null;
  }
}

/**
 * The rects without one window (docked windows reopen at their default place).
 */
export function omitRect(
  rects: Record<string, IWindowRect>,
  id: string,
): Record<string, IWindowRect> {
  return Object.fromEntries(Object.entries(rects).filter(([key]) => key !== id));
}

/**
 * Storage key of the saved rect of a sheet window on this device.
 */
export function sheetWindowKey(id: string): string {
  return `${ARENA_SHEET_WINDOW_LAYOUT.storagePrefix}${id}`;
}

/**
 * Rect of a sheet window saved on this device (null when absent, malformed or storage is blocked).
 */
export function readSavedRect(id: string): IWindowRect | null {
  try {
    return parseSheetWindowRect(window.localStorage.getItem(sheetWindowKey(id)));
  } catch {
    return null;
  }
}
