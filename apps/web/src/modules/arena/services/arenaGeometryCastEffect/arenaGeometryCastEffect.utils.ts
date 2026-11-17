import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/**
 * A point of the helix the symbols draw toward the target: `s` from 0 (caster) to 1 (target), winding
 * `turns` times around the straight line with the given phase, widest in the middle.
 */
export function helixPoint(
  toward: IArenaPoint2,
  s: number,
  width: number,
  turns: number,
  offset: number,
): IArenaPoint2 {
  const length = Math.hypot(toward.x, toward.y) || 1;
  const normal = { x: -toward.y / length, y: toward.x / length };
  const swing = Math.sin(s * Math.PI * 2 * turns + offset) * width * Math.sin(Math.PI * s);
  return { x: toward.x * s + normal.x * swing, y: toward.y * s + normal.y * swing };
}

/**
 * Corners of a square of half side `half` turned by `angle` around `center`, flat for `Graphics.poly`.
 */
export function squarePoints(center: IArenaPoint2, half: number, angle: number): number[] {
  const points: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const a = angle + Math.PI / 4 + (index * Math.PI) / 2;
    points.push(
      center.x + Math.cos(a) * half * Math.SQRT2,
      center.y + Math.sin(a) * half * Math.SQRT2,
    );
  }
  return points;
}
