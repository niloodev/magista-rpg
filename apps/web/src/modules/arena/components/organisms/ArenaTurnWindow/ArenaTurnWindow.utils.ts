import { ARENA_TURN_WINDOW_LAYOUT } from "@/modules/arena/arena.constants";
import { clampWindowRect, type IWindowRect } from "@/shared/components/organisms";

/**
 * Default rect of the turn order window: the top right corner of the map area, below the top bar.
 */
export function defaultTurnWindowRect(
  panels: { left: number; right: number },
  viewport: { width: number; height: number },
): IWindowRect {
  const { width, height, gap, top, min } = ARENA_TURN_WINDOW_LAYOUT;
  return clampWindowRect(
    { x: viewport.width - panels.right - gap - width, y: top, width, height },
    viewport,
    min,
    top - gap,
  );
}

/**
 * Reads the turn order window rect saved on this device, ignoring anything malformed or blocked storage.
 */
export function readTurnWindowRect(): IWindowRect | null {
  try {
    const raw = window.localStorage.getItem(ARENA_TURN_WINDOW_LAYOUT.rectKey);
    if (!raw) return null;
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
 * Saves the turn order window rect on this device (ignored when storage is blocked).
 */
export function saveTurnWindowRect(rect: IWindowRect): void {
  try {
    window.localStorage.setItem(ARENA_TURN_WINDOW_LAYOUT.rectKey, JSON.stringify(rect));
  } catch {
    return;
  }
}
