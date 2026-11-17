import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import {
  BUTTERFLY_CLOSED,
  BUTTERFLY_FLUTTER,
  BUTTERFLY_HEADING_STEP,
  BUTTERFLY_HOVER_SPEED,
} from "./arenaButterflySwarm.constants";

/** How open the wings are `age` seconds into its flight, beating `rate` times a second (from closed to 1). */
export function wingBeat(age: number, rate: number): number {
  return BUTTERFLY_CLOSED + (1 - BUTTERFLY_CLOSED) * Math.abs(Math.cos(Math.PI * rate * age));
}

/** The erratic flutter of a butterfly off its path at `time`: two unrelated waves per axis, `size` its wingspan. */
export function flutter(time: number, seed: number, size: number): IArenaPoint2 {
  const rate = BUTTERFLY_FLUTTER.rate * Math.PI * 2;
  const reach = BUTTERFLY_FLUTTER.reach * size;
  return {
    x:
      reach * (0.6 * Math.sin(time * rate + seed) + 0.4 * Math.sin(time * rate * 1.7 + seed * 3.1)),
    y:
      reach *
      (0.6 * Math.cos(time * rate * 1.3 + seed * 1.7) + 0.4 * Math.sin(time * rate * 2.3 + seed)),
  };
}

/**
 * The rotation of a butterfly at `time` on `path` (its head points where it goes; hovering, it turns its head
 * up). The sprite is drawn head up, so a heading to the right is a quarter turn.
 */
export function flightRotation(
  path: (time: number) => IArenaPoint2,
  time: number,
  size: number,
): number {
  const step = BUTTERFLY_HEADING_STEP;
  const before = path(time - step);
  const after = path(time + step);
  const x = (after.x - before.x) / (step * 2);
  const y = (after.y - before.y) / (step * 2) - BUTTERFLY_HOVER_SPEED * size;
  return Math.atan2(y, x) + Math.PI / 2;
}

/** Point of a quadratic curve from `from` through the pull of `control` to `to`, at `s` (0 to 1). */
export function curvePoint(
  from: IArenaPoint2,
  control: IArenaPoint2,
  to: IArenaPoint2,
  s: number,
): IArenaPoint2 {
  const u = 1 - s;
  return {
    x: u * u * from.x + 2 * u * s * control.x + s * s * to.x,
    y: u * u * from.y + 2 * u * s * control.y + s * s * to.y,
  };
}

/** A smooth start and stop (0 to 1). */
export function easeInOut(s: number): number {
  const c = Math.min(Math.max(s, 0), 1);
  return c * c * (3 - 2 * c);
}

/** How visible a butterfly is along its life by default: it fades in quickly and out a little slower. */
export function fadeInOut(life: number): number {
  return Math.min(life * 6, 1) * Math.min((1 - life) * 4, 1);
}
