/**
 * Keeps a panel width inside its limits, rounded to whole pixels.
 */
export function clampWidth(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(value, min), max));
}
