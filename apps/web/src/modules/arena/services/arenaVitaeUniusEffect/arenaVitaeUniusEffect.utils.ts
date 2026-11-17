import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { IFlowerCircle, IVitaeVine } from "./arenaVitaeUniusEffect.types";

/**
 * The 19 circles of the Flower of Life of circle radius `radius`: the center, the six around it and the twelve
 * of the outer ring (six at twice the radius, six between them), each circle passing through its neighbors'
 * centers.
 */
export function flowerOfLife(radius: number): IFlowerCircle[] {
  const circles: IFlowerCircle[] = [{ center: { x: 0, y: 0 }, ring: 0, startAngle: -Math.PI / 2 }];
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    circles.push({
      center: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      ring: 1,
      startAngle: angle + Math.PI,
    });
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    const between = angle + Math.PI / 6;
    circles.push({
      center: { x: Math.cos(angle) * radius * 2, y: Math.sin(angle) * radius * 2 },
      ring: 2,
      startAngle: angle + Math.PI,
    });
    circles.push({
      center: {
        x: Math.cos(between) * radius * Math.sqrt(3),
        y: Math.sin(between) * radius * Math.sqrt(3),
      },
      ring: 2,
      startAngle: between + Math.PI,
    });
  }
  return circles;
}

/**
 * How strongly the heart beats at `t` (0 to about 1): each beat is a "lub" and a softer "dub" `gap` later,
 * each fading over `width`.
 */
export function heartbeat(t: number, beats: readonly number[], gap: number, width: number): number {
  let pulse = 0;
  for (const beat of beats) {
    for (const [at, strength] of [
      [beat, 1],
      [beat + gap, 0.6],
    ] as const) {
      const since = t - at;
      if (since >= 0 && since < width) pulse = Math.max(pulse, strength * (1 - since / width) ** 2);
    }
  }
  return pulse;
}

/**
 * A vine growing from `radius` outward along `angle`, `length` long: it curls to one side as it goes (by `curl`
 * radians in all) with a gentle wave, and sprouts `leaves` leaves on alternating sides.
 */
export function vinePath(
  angle: number,
  radius: number,
  length: number,
  curl: number,
  leaves: number,
  random: () => number,
): Omit<IVitaeVine, "delay" | "width"> {
  const steps = 26;
  const points: IArenaPoint2[] = [];
  let heading = angle;
  let point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  points.push(point);
  const wave = random() * Math.PI * 2;
  for (let step = 1; step <= steps; step += 1) {
    const share = step / steps;
    heading = angle + curl * share ** 1.4 + Math.sin(share * 7 + wave) * 0.12;
    const stride = (length / steps) * (1 - share * 0.35);
    point = { x: point.x + Math.cos(heading) * stride, y: point.y + Math.sin(heading) * stride };
    points.push(point);
  }
  return {
    points,
    leaves: Array.from({ length: leaves }, (_, index) => ({
      at: 0.18 + (index / Math.max(leaves, 1)) * 0.75 + random() * 0.04,
      side: index % 2 === 0 ? 1 : -1,
      size: 0.7 + random() * 0.5,
    })),
  };
}

/** The point at `share` of a path (by index, close enough for drawing) and the direction it goes there. */
export function pathPoint(
  points: IArenaPoint2[],
  share: number,
): { point: IArenaPoint2; angle: number } {
  const last = points.length - 1;
  const index = Math.min(Math.max(Math.round(share * last), 1), last);
  const point = points[index] ?? { x: 0, y: 0 };
  const before = points[index - 1] ?? point;
  return { point, angle: Math.atan2(point.y - before.y, point.x - before.x) };
}

/** Points of an almond leaf at `at` pointing along `angle`, `length` long, flat for `Graphics.poly`. */
export function leafShape(at: IArenaPoint2, angle: number, length: number): number[] {
  const flat: number[] = [];
  const width = length * 0.36;
  for (let step = 0; step <= 12; step += 1) {
    const s = step / 12;
    const along = s * length;
    const side = Math.sin(Math.PI * s) * width;
    flat.push(
      at.x + Math.cos(angle) * along - Math.sin(angle) * side,
      at.y + Math.sin(angle) * along + Math.cos(angle) * side,
    );
  }
  for (let step = 11; step >= 1; step -= 1) {
    const s = step / 12;
    const along = s * length;
    const side = -Math.sin(Math.PI * s) * width * 0.7;
    flat.push(
      at.x + Math.cos(angle) * along - Math.sin(angle) * side,
      at.y + Math.sin(angle) * along + Math.cos(angle) * side,
    );
  }
  return flat;
}
