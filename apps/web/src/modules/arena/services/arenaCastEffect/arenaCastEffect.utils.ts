import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/**
 * Point of the orb flight at `s` (0 to 1): a quadratic arc from the caster to the target, bowing upwards by a
 * share of the distance.
 */
export function castArc(toward: IArenaPoint2, s: number, bow = 0.28): IArenaPoint2 {
  const distance = Math.hypot(toward.x, toward.y);
  const control = { x: toward.x / 2, y: toward.y / 2 - distance * bow };
  const u = 1 - s;
  return {
    x: 2 * u * s * control.x + s * s * toward.x,
    y: 2 * u * s * control.y + s * s * toward.y,
  };
}
