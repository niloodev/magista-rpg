import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/**
 * A writhing tendril from `base` to `tip`: points along the line, pushed sideways by a wave that grows toward
 * the tip (`sway` is its size, `wave` its phase).
 */
export function tendrilPath(
  base: IArenaPoint2,
  tip: IArenaPoint2,
  sway: number,
  wave: number,
  samples = 18,
): IArenaPoint2[] {
  const dx = tip.x - base.x;
  const dy = tip.y - base.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  return Array.from({ length: samples + 1 }, (_, index) => {
    const s = index / samples;
    const push = Math.sin(s * Math.PI * 2.2 + wave) * sway * s;
    return { x: base.x + dx * s + normal.x * push, y: base.y + dy * s + normal.y * push };
  });
}

/**
 * A shadow coiling from the ground around the target onto it: from `from` radii out at `angle` it winds `wrap`
 * of a turn toward the target edge (`to` radii), rising in an arc of `lift` on the way, with a wave along it at
 * phase `wave`; points up to `reach` (0 to 1) of the way, the ground squashed by `tilt`.
 */
export function coilPath(
  angle: number,
  wrap: number,
  from: number,
  to: number,
  lift: number,
  tilt: number,
  wave: number,
  reach: number,
  samples = 26,
): IArenaPoint2[] {
  const points: IArenaPoint2[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const s = (index / samples) * reach;
    const turn = angle + wrap * s * 1.5;
    const radius = from + (to - from) * s ** 0.8 + Math.sin(s * Math.PI * 3 - wave) * to * 0.12 * s;
    points.push({
      x: Math.cos(turn) * radius,
      y: Math.sin(turn) * radius * tilt - lift * Math.sin(Math.PI * s) * (1 - s * 0.4),
    });
  }
  return points;
}

/**
 * A crescent as a closed outline: the disk of `radius` at the origin minus the disk of `inner` at `cut` (the
 * waning moon), traced along the outer edge where it is outside the cut and back along the cut's edge.
 */
export function crescent(radius: number, inner: number, cut: IArenaPoint2, samples = 48): number[] {
  const outside = (x: number, y: number) => Math.hypot(x - cut.x, y - cut.y) > inner;
  const points: number[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const angle = -Math.PI + (index / samples) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (outside(x, y)) points.push(x, y);
  }
  for (let index = samples; index >= 0; index -= 1) {
    const angle = -Math.PI + (index / samples) * Math.PI * 2;
    const x = cut.x + Math.cos(angle) * inner;
    const y = cut.y + Math.sin(angle) * inner;
    if (Math.hypot(x, y) <= radius) points.push(x, y);
  }
  return points;
}

/**
 * How wide a shadow is along its length (0 at the ground, 1 at its point), as a share of its widest: it swells
 * out of the ground, then narrows smoothly to a sharp point, with no square end.
 */
export function coilWidth(along: number): number {
  const a = Math.min(Math.max(along, 0), 1);
  const rise = a / 0.15;
  const swell = a >= 0.15 ? 1 : rise * rise * (3 - 2 * rise);
  return (0.35 + 0.65 * swell) * (1 - a) ** 0.8;
}
