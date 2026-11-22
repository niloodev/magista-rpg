import type { IEnergyPalette } from "@/modules/arena/services/arenaEnergyFlow";

import { PARTY_COLOR_BLEND_MS, PARTY_COLOR_HOLD_MS } from "./arenaPartyToken.constants";

/** Mixes two RGB colors (`t` 0 is `a`, 1 is `b`). */
export function mixColor(a: number, b: number, t: number): number {
  const mix = (shift: number) => {
    const from = (a >> shift) & 0xff;
    const to = (b >> shift) & 0xff;
    return Math.round(from + (to - from) * t) << shift;
  };
  return mix(16) | mix(8) | mix(0);
}

/**
 * The color of the party token `elapsed` ms after it appeared: each color holds, then blends smoothly into the
 * next, round and round.
 */
export function partyColorAt(
  elapsed: number,
  colors: readonly number[],
  hold = PARTY_COLOR_HOLD_MS,
  blend = PARTY_COLOR_BLEND_MS,
): number {
  if (colors.length === 0) return 0xffffff;
  const span = hold + blend;
  const turn = Math.max(elapsed, 0) / span;
  const index = Math.floor(turn) % colors.length;
  const within = (turn - Math.floor(turn)) * span;
  const current = colors[index] ?? 0xffffff;
  if (within <= hold) return current;
  const next = colors[(index + 1) % colors.length] ?? current;
  const t = (within - hold) / blend;
  return mixColor(current, next, t * t * (3 - 2 * t));
}

/** An energy palette from one color: a pale core, a lifted body and the color itself at the edge. */
export function paletteOf(color: number): IEnergyPalette {
  return {
    core: mixColor(color, 0xffffff, 0.8),
    mid: mixColor(color, 0xffffff, 0.25),
    deep: color,
  };
}

/**
 * The strokes of an SVG path made of straight lines (`M`, `L`, `H`, `V`, `Z`, absolute) as polylines, scaled by
 * `scale`: how the ring runes are drawn.
 */
export function pathStrokes(path: string, scale: number): { x: number; y: number }[][] {
  const tokens = path.match(/[MLHVZ]|-?\d*\.?\d+/g) ?? [];
  const strokes: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let start = { x: 0, y: 0 };
  let index = 0;
  const next = () => Number(tokens[index++] ?? 0);
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === "M") {
      if (current.length > 1) strokes.push(current);
      x = next();
      y = next();
      start = { x, y };
      current = [{ x: x * scale, y: y * scale }];
    } else if (command === "L" || command === "H" || command === "V") {
      if (command !== "V") x = next();
      if (command === "L") y = next();
      else if (command === "V") y = next();
      current.push({ x: x * scale, y: y * scale });
    } else if (command === "Z") {
      current.push({ x: start.x * scale, y: start.y * scale });
    }
  }
  if (current.length > 1) strokes.push(current);
  return strokes;
}
