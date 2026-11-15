import { PARALLAX_SETTLE } from "./LoginBackground.constants";
import type { ParallaxPoint } from "./LoginBackground.types";

/**
 * Builds the CSS translate for a parallax layer moving at the given speed.
 */
export function toLayerTransform(point: ParallaxPoint, speed: number): string {
  return `translate(${(-point.x * speed).toFixed(2)}px, ${(-point.y * speed).toFixed(2)}px)`;
}

/**
 * Builds the radial cursor light centered on the current parallax point.
 */
export function toCursorLight(point: ParallaxPoint): string {
  const lx = ((point.x + 0.5) * 100).toFixed(1);
  const ly = ((point.y + 0.5) * 100).toFixed(1);
  return `radial-gradient(ellipse 45% 42% at ${lx}% ${ly}%, rgba(225,28,92,0.13), transparent 68%)`;
}

/**
 * True when the layers are close enough to the cursor to stop animating (well under a pixel of movement).
 */
export function isSettled(current: ParallaxPoint, target: ParallaxPoint): boolean {
  return (
    Math.abs(target.x - current.x) < PARALLAX_SETTLE &&
    Math.abs(target.y - current.y) < PARALLAX_SETTLE
  );
}
