import type { ISheetResource } from "@magista/shared";

import {
  STATUS_BAR_EXPANDED_PX,
  STATUS_BAR_GAP_PX,
  STATUS_BAR_LIFT_PX,
  STATUS_BAR_MAX_PX,
  STATUS_BAR_MIN_PX,
  STATUS_BAR_MIN_WIDTH_PX,
  STATUS_BAR_WIDTH_RATIO,
} from "./arenaStatusBars.constants";
import type { IStatusBarLayout, IStatusTween } from "./arenaStatusBars.types";

/**
 * Ease out (cubic): fast at first, settling softly.
 */
export function easeOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - clamped) ** 3;
}

/**
 * Value of a tween at `now` and whether it is over.
 */
export function tweenValue(tween: IStatusTween, now: number): { value: number; done: boolean } {
  const elapsed = now - tween.start - tween.delay;
  if (elapsed <= 0) return { value: tween.from, done: tween.from === tween.to };
  if (tween.duration <= 0 || elapsed >= tween.duration) return { value: tween.to, done: true };
  const t = easeOutCubic(elapsed / tween.duration);
  return { value: tween.from + (tween.to - tween.from) * t, done: false };
}

/**
 * A tween that already sits on its value.
 */
export function stillTween(value: number): IStatusTween {
  return { from: value, to: value, start: 0, delay: 0, duration: 0 };
}

/**
 * Share of a resource filled (0 to 1), or null when the resource has no usable maximum (no bar).
 */
export function resourceFraction(resource: ISheetResource): number | null {
  if (resource.max === null || resource.max <= 0) return null;
  const current = resource.current ?? resource.max;
  return Math.min(Math.max(current / resource.max, 0), 1);
}

/**
 * Bar sizes in map pixels: the thickness stays between a few screen pixels whatever the zoom (or opens to fit
 * the values), and the width follows the token without getting too small to read.
 */
export function barLayout(size: number, cameraScale: number, expanded: boolean): IStatusBarLayout {
  const scale = cameraScale > 0 ? cameraScale : 1;
  const natural = Math.min(Math.max(size * 0.06 * scale, STATUS_BAR_MIN_PX), STATUS_BAR_MAX_PX);
  const thickness = (expanded ? STATUS_BAR_EXPANDED_PX : natural) / scale;
  const width = Math.max(size * STATUS_BAR_WIDTH_RATIO, STATUS_BAR_MIN_WIDTH_PX / scale);
  return { width, thickness, gap: STATUS_BAR_GAP_PX / scale, lift: STATUS_BAR_LIFT_PX / scale };
}

/**
 * Text of a value pair ("12/20"); an empty current value reads as the maximum.
 */
export function resourceLabel(resource: ISheetResource): string {
  return `${resource.current ?? resource.max ?? 0}/${resource.max ?? 0}`;
}
