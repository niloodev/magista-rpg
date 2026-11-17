import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/**
 * Points along a cut from `from` to `to`, bowed sideways by `bend` (share of its length): a quadratic curve, the
 * same as a blade's swing.
 */
export function slashPath(
  from: IArenaPoint2,
  to: IArenaPoint2,
  bend: number,
  samples = 20,
): IArenaPoint2[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const control = {
    x: (from.x + to.x) / 2 - (dy / length) * bend * length,
    y: (from.y + to.y) / 2 + (dx / length) * bend * length,
  };
  return Array.from({ length: samples + 1 }, (_, index) => {
    const s = index / samples;
    const u = 1 - s;
    return {
      x: u * u * from.x + 2 * u * s * control.x + s * s * to.x,
      y: u * u * from.y + 2 * u * s * control.y + s * s * to.y,
    };
  });
}
