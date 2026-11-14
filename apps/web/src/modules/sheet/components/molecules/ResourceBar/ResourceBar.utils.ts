import type { ISheetResource } from "@magista/shared";

/**
 * Fill percentage of a resource bar, clamped to 0..100.
 */
export function resourcePercent({ current, max }: ISheetResource): number {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.max(0, ((current ?? 0) / max) * 100));
}
