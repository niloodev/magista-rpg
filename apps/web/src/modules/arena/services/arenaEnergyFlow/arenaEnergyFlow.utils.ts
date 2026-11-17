import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { EnergyPath, EnergyWidth, IEnergyRibbon } from "./arenaEnergyFlow.types";

/** `count` points evenly spaced along a path (by length), the first and last kept. */
export function resamplePath(path: EnergyPath, count: number): IArenaPoint2[] {
  const first = path[0] ?? { x: 0, y: 0 };
  if (path.length < 2 || count < 2) return Array.from({ length: Math.max(count, 1) }, () => first);
  const lengths = [0];
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1] ?? first;
    const b = path[index] ?? first;
    lengths.push((lengths[index - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = lengths[lengths.length - 1] ?? 0;
  const points: IArenaPoint2[] = [];
  let segment = 1;
  for (let index = 0; index < count; index += 1) {
    const at = (total * index) / (count - 1);
    while (segment < path.length - 1 && (lengths[segment] ?? 0) < at) segment += 1;
    const a = path[segment - 1] ?? first;
    const b = path[segment] ?? first;
    const from = lengths[segment - 1] ?? 0;
    const span = (lengths[segment] ?? from) - from;
    const share = span > 0 ? (at - from) / span : 0;
    points.push({ x: a.x + (b.x - a.x) * share, y: a.y + (b.y - a.y) * share });
  }
  return points;
}

/**
 * The ribbon around a path: two vertices per point, one on each side at half the width there (`width` is a
 * number or a function of the share along), with UVs along (0 to 1) and across (0 to 1), and the triangles.
 * A closed path wraps its ends together.
 */
export function buildRibbon(path: EnergyPath, width: EnergyWidth, closed = false): IEnergyRibbon {
  const count = path.length;
  const positions = new Float32Array(count * 4);
  const uvs = new Float32Array(count * 4);
  const segments = Math.max(count - 1, 0);
  const indices = new Uint32Array(segments * 6);
  let length = 0;
  for (let index = 0; index < count; index += 1) {
    const point = path[index] ?? { x: 0, y: 0 };
    const before = path[index - 1] ?? (closed ? path[count - 2] : undefined) ?? point;
    const after = path[index + 1] ?? (closed ? path[1] : undefined) ?? point;
    if (index > 0) {
      const last = path[index - 1] ?? point;
      length += Math.hypot(point.x - last.x, point.y - last.y);
    }
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const norm = Math.hypot(dx, dy) || 1;
    const share = count > 1 ? index / (count - 1) : 0;
    const half = (typeof width === "number" ? width : width(share)) / 2;
    const nx = (-dy / norm) * half;
    const ny = (dx / norm) * half;
    positions.set([point.x + nx, point.y + ny, point.x - nx, point.y - ny], index * 4);
    uvs.set([share, 0, share, 1], index * 4);
  }
  for (let index = 0; index < segments; index += 1) {
    const a = index * 2;
    indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], index * 6);
  }
  return { positions, uvs, indices, length };
}

/** A closed circle (or ellipse, with `squash` on y) of `count` points, starting at `start` radians. */
export function circlePath(radius: number, count: number, squash = 1, start = 0): IArenaPoint2[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = start + (index / (count - 1)) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * squash };
  });
}

/** A color as the three 0 to 1 channels a shader takes. */
export function colorChannels(color: number): [number, number, number] {
  return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
}

/**
 * A channel of energy from `from` to `to`: a cubic curve bowing to one side by `bend` and the other way by
 * `counter` near its end (shares of its length), so it reads as a flowing S or arc, as `count` points.
 */
export function channelPath(
  from: IArenaPoint2,
  to: IArenaPoint2,
  bend: number,
  counter: number,
  count: number,
): IArenaPoint2[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const a = {
    x: from.x + dx * 0.33 + normal.x * bend * length,
    y: from.y + dy * 0.33 + normal.y * bend * length,
  };
  const b = {
    x: from.x + dx * 0.7 + normal.x * counter * length,
    y: from.y + dy * 0.7 + normal.y * counter * length,
  };
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const u = 1 - t;
    return {
      x: u * u * u * from.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t * t * t * to.x,
      y: u * u * u * from.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * to.y,
    };
  });
}
