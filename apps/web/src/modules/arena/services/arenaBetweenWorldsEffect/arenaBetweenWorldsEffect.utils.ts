import type { ISoundWave } from "@/modules/arena/services/arenaSoundWave";
import { easeOutBack, phase, type IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import {
  BETWEEN_CLAP,
  BETWEEN_FOLDED,
  BETWEEN_FOREWING,
  BETWEEN_HINDWING,
  BETWEEN_PHASES,
} from "./arenaBetweenWorldsEffect.constants";
import type { IBetweenRipple, IWingSlot } from "./arenaBetweenWorldsEffect.types";

/**
 * A smooth closed outline through `controls` (Catmull-Rom), `samples` points long: the soft edge of a wing
 * drawn from a handful of control points.
 */
export function smoothLoop(controls: readonly IArenaPoint2[], samples: number): IArenaPoint2[] {
  const count = controls.length;
  if (count < 3) return controls.map((point) => ({ ...point }));
  const at = (index: number) => controls[((index % count) + count) % count] ?? { x: 0, y: 0 };
  return Array.from({ length: samples }, (_, sample) => {
    const position = (sample / samples) * count;
    const index = Math.floor(position);
    const s = position - index;
    const p0 = at(index - 1);
    const p1 = at(index);
    const p2 = at(index + 1);
    const p3 = at(index + 2);
    const blend = (a: number, b: number, c: number, d: number) =>
      0.5 *
      (2 * b +
        (-a + c) * s +
        (2 * a - 5 * b + 4 * c - d) * s * s +
        (-a + 3 * b - 3 * c + d) * s ** 3);
    return { x: blend(p0.x, p1.x, p2.x, p3.x), y: blend(p0.y, p1.y, p2.y, p3.y) };
  });
}

/** Whether `point` is inside the closed `polygon` (even-odd rule). */
export function insidePolygon(point: IArenaPoint2, polygon: readonly IArenaPoint2[]): boolean {
  let inside = false;
  for (let index = 0, last = polygon.length - 1; index < polygon.length; last = index, index += 1) {
    const a = polygon[index];
    const b = polygon[last];
    if (!a || !b) continue;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

/**
 * Spots inside the right wings of the god (forewing and hindwing alike, in half-spans) where the butterflies that
 * form them settle, scattered evenly enough to show the shape.
 */
export function wingSlots(count: number, random: () => number): IWingSlot[] {
  const wings = [smoothLoop(BETWEEN_FOREWING, 48), smoothLoop(BETWEEN_HINDWING, 48)];
  const slots: IWingSlot[] = [];
  let tries = 0;
  while (slots.length < count && tries < count * 60) {
    tries += 1;
    const point = { x: random(), y: random() * 1.8 - 1 };
    if (wings.some((wing) => insidePolygon(point, wing))) slots.push(point);
  }
  return slots;
}

/**
 * How far the wings of the god are spread at `t` (0 folded, 1 open): they unfold out of the swarm, breathe,
 * are raised a little more before the blow, clap shut just as the blow lands and stay folded while they fall
 * apart.
 */
export function wingSpread(t: number): number {
  const { wings, pull, hit } = BETWEEN_PHASES;
  const open = (at: number) => {
    const unfold = Math.max(easeOutBack(phase(at, wings, wings + 0.1)), 0);
    const breath = 1 - 0.07 * (0.5 + 0.5 * Math.sin(at * 60));
    const raise = 0.12 * phase(at, pull, hit - BETWEEN_CLAP) ** 2;
    return unfold * (breath + raise);
  };
  if (t < hit - BETWEEN_CLAP) return open(t);
  const shut = phase(t, hit - BETWEEN_CLAP, hit) ** 2;
  return open(hit - BETWEEN_CLAP) * (1 - shut) + BETWEEN_FOLDED * shut;
}

/** Where a point on a log spiral arm of the whirlpool is: `along` from its outer end (0) to its heart (1). */
export function spiralPoint(
  along: number,
  outer: number,
  inner: number,
  turns: number,
  start: number,
  tilt: number,
): IArenaPoint2 {
  const radius = outer * (inner / outer) ** along;
  const angle = start + along * turns * Math.PI * 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * tilt };
}

/** The rings of water of the spell: slow rings as the world sinks, rings closing in as the passage pulls, a burst at the hit. */
export function passageRipplePlan(): IBetweenRipple[] {
  const { pull, hit } = BETWEEN_PHASES;
  return [
    ...[0, 0.05, 0.1].map((born) => ({ born, span: 0.22, from: 0.6, to: 13, strength: 0.55 })),
    ...[0, 0.04, 0.08].map((delay) => ({
      born: pull + delay,
      span: 0.13,
      from: 9,
      to: 0.9,
      strength: 0.45,
    })),
    ...[0, 0.035].map((delay) => ({
      born: hit + delay,
      span: 0.2,
      from: 0.6,
      to: 17,
      strength: 1,
    })),
  ];
}

/** The waves alive at `t` for the sound filter (radius in token radii, full rings), at most eight. */
export function passageRipples(t: number, plan: readonly IBetweenRipple[]): ISoundWave[] {
  const waves: ISoundWave[] = [];
  for (const ripple of plan) {
    const life = (t - ripple.born) / ripple.span;
    if (life <= 0 || life >= 1) continue;
    const eased = 1 - (1 - life) ** 2;
    waves.push({
      radius: ripple.from + (ripple.to - ripple.from) * eased,
      strength: ripple.strength * Math.sin(Math.PI * life),
      thickness: 0.8 + 1.8 * life,
      spread: Math.PI * 1.01,
    });
  }
  return waves.slice(0, 8);
}
