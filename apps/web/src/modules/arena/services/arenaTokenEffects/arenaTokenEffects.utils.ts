import { autoEffectStyle } from "@magista/shared";
import type { ArenaChangeKind, ArenaEffectStyle, ArenaResourceKey } from "@magista/shared";

import type { IArenaParticle, IArenaPoint2, IFxParticleSpawn } from "./arenaTokenEffects.types";

/**
 * Animation of a change: the one chosen by hand, else the automatic one (Golpe, Fissura, Brasa viva, Clareza).
 */
export function effectStyle(
  kind: ArenaChangeKind,
  resource: ArenaResourceKey,
  chosen?: ArenaEffectStyle,
): ArenaEffectStyle {
  return chosen ?? autoEffectStyle(kind, resource);
}

/**
 * Small deterministic random generator (mulberry32), so an animation looks the same on every frame.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Progress of a phase inside the animation: 0 before `start`, 1 after `end`.
 */
export function phase(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0;
  return Math.min(Math.max((t - start) / (end - start), 0), 1);
}

/**
 * Rises from 0 to 1 and back to 0 over the phase (a sine bump).
 */
export function bump(t: number, start = 0, end = 1): number {
  const p = phase(t, start, end);
  return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p);
}

/**
 * Horizontal shake that dies out: `cycles` back and forth over the first `share` of the animation.
 */
export function shake(t: number, amplitude: number, cycles = 5, share = 0.5): number {
  const p = phase(t, 0, share);
  if (p >= 1) return 0;
  return Math.sin(p * Math.PI * 2 * cycles) * amplitude * (1 - p) ** 2;
}

/**
 * Ease out with a small overshoot (the pop of a number or a swell).
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = Math.min(Math.max(t, 0), 1);
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
}

/**
 * Particles thrown out of the token, each with its own direction, speed, size and spin.
 */
export function burst(count: number, random: () => number): IArenaParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2 + (random() - 0.5) * 0.9,
    speed: 0.6 + random() * 0.8,
    size: 0.5 + random() * 0.8,
    spin: (random() - 0.5) * 8,
  }));
}

/**
 * A crack from the center outwards: a jagged line of `segments` steps in unit radius coordinates.
 */
export function crackPath(angle: number, segments: number, random: () => number): IArenaPoint2[] {
  const points: IArenaPoint2[] = [{ x: 0, y: 0 }];
  for (let step = 1; step <= segments; step += 1) {
    const distance = step / segments;
    const bend = angle + (random() - 0.5) * 0.7;
    points.push({ x: Math.cos(bend) * distance, y: Math.sin(bend) * distance });
  }
  return points;
}

/**
 * Text of an applied amount ("-5" for damage, "+5" for healing).
 */
export function amountLabel(kind: ArenaChangeKind, amount: number): string {
  return kind === "damage" ? `-${amount}` : `+${amount}`;
}

/**
 * Where a particle is `age` seconds after launch: its speed fades with drag (exponential) while gravity pulls.
 */
export function particlePosition(spawn: IFxParticleSpawn, age: number): IArenaPoint2 {
  const travel = spawn.drag > 0 ? (1 - Math.exp(-spawn.drag * age)) / spawn.drag : age;
  return {
    x: spawn.x + spawn.vx * travel,
    y: spawn.y + spawn.vy * travel + 0.5 * spawn.gravity * age * age,
  };
}

/**
 * Speed of a particle `age` seconds after launch (to point a streak where it goes).
 */
export function particleVelocity(spawn: IFxParticleSpawn, age: number): IArenaPoint2 {
  const fade = Math.exp(-spawn.drag * age);
  return { x: spawn.vx * fade, y: spawn.vy * fade + spawn.gravity * age };
}

/**
 * Mixes two colors (0xRRGGBB) channel by channel.
 */
export function mixColor(from: number, to: number, t: number): number {
  const p = Math.min(Math.max(t, 0), 1);
  const channel = (shift: number) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * p) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}

/**
 * Color along a gradient of evenly spaced stops (0xRRGGBB), `t` from 0 to 1.
 */
export function mixStops(stops: readonly number[], t: number): number {
  const first = stops[0] ?? 0;
  if (stops.length < 2) return first;
  const scaled = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  return mixColor(stops[index] ?? first, stops[index + 1] ?? first, scaled - index);
}

/**
 * Outline of a blade cut from `from` to `to`, bent sideways by `bend` (share of the length), thick in the
 * middle and sharp at the ends; only the part between `start` and `end` (0 to 1 along the cut) is returned.
 */
export function bladeOutline(
  from: IArenaPoint2,
  to: IArenaPoint2,
  bend: number,
  width: number,
  start: number,
  end: number,
  samples = 14,
): number[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const control = {
    x: (from.x + to.x) / 2 + normal.x * bend * length,
    y: (from.y + to.y) / 2 + normal.y * bend * length,
  };
  const left: number[] = [];
  const right: number[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const s = start + ((end - start) * index) / samples;
    const u = 1 - s;
    const x = u * u * from.x + 2 * u * s * control.x + s * s * to.x;
    const y = u * u * from.y + 2 * u * s * control.y + s * s * to.y;
    const tx = 2 * u * (control.x - from.x) + 2 * s * (to.x - control.x);
    const ty = 2 * u * (control.y - from.y) + 2 * s * (to.y - control.y);
    const tl = Math.hypot(tx, ty) || 1;
    const half = (Math.sin(Math.PI * s) * width) / 2;
    left.push(x - (ty / tl) * half, y + (tx / tl) * half);
    right.unshift(x + (ty / tl) * half, y - (tx / tl) * half);
  }
  return [...left, ...right];
}

/**
 * Points of a star (alternating outer and inner radius), flat for `Graphics.poly`: comic bursts and stars.
 */
export function starPolygon(
  center: IArenaPoint2,
  outer: number,
  inner: number,
  points: number,
  rotation = 0,
): number[] {
  const flat: number[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = rotation + (index * Math.PI) / points - Math.PI / 2;
    flat.push(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  }
  return flat;
}

/**
 * The middle of a group of targets (offsets in radii of one of them, see `IArenaEffectOptions.group`) and how far
 * it spreads from there, out to the edge of the farthest target (at least one radius: a single target).
 */
export function groupShape(points: readonly IArenaPoint2[] | undefined): {
  center: IArenaPoint2;
  spread: number;
} {
  if (!points || points.length === 0) return { center: { x: 0, y: 0 }, spread: 1 };
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
  const spread =
    Math.max(...points.map((point) => Math.hypot(point.x - center.x, point.y - center.y))) + 1;
  return { center, spread };
}
