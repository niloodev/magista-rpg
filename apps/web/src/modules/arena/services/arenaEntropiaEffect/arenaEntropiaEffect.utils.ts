import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { IChainLink } from "./arenaEntropiaEffect.types";

/** Point at `t` (0 to 1) of the quadratic curve from `a` to `b` bent through `control`. */
export function quadPoint(
  a: IArenaPoint2,
  control: IArenaPoint2,
  b: IArenaPoint2,
  t: number,
): IArenaPoint2 {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * control.y + t * t * b.y,
  };
}

/**
 * The links of a chain from `from` to `to` bent through `control`, one every `step` pixels along the curve, up
 * to `reach` (0 to 1: how far the chain has flown), each with the angle of the chain where it sits.
 */
export function chainLinks(
  from: IArenaPoint2,
  control: IArenaPoint2,
  to: IArenaPoint2,
  step: number,
  reach: number,
): IChainLink[] {
  const samples = 48;
  const curve: IArenaPoint2[] = [];
  for (let index = 0; index <= samples; index += 1)
    curve.push(quadPoint(from, control, to, (index / samples) * reach));
  const links: IChainLink[] = [];
  let carried = 0;
  for (let index = 1; index < curve.length; index += 1) {
    const a = curve[index - 1] ?? from;
    const b = curve[index] ?? from;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    let along = step - carried;
    while (along <= length) {
      const share = length > 0 ? along / length : 0;
      links.push({ point: { x: a.x + (b.x - a.x) * share, y: a.y + (b.y - a.y) * share }, angle });
      along += step;
    }
    carried = (carried + length) % step;
  }
  return links;
}

/**
 * Where a verse is on its way into the hole at `pull` (0 to 1): it spirals in, turning faster and faster, and
 * is stretched along its path (spaghettified) as it nears the center.
 */
export function spiralIn(
  start: IArenaPoint2,
  center: IArenaPoint2,
  pull: number,
  turns: number,
): { point: IArenaPoint2; stretch: number; angle: number } {
  const dx = start.x - center.x;
  const dy = start.y - center.y;
  const radius = Math.hypot(dx, dy) * (1 - pull ** 1.6);
  const angle = Math.atan2(dy, dx) + turns * Math.PI * 2 * pull ** 2;
  return {
    point: { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius },
    stretch: 1 + 2.5 * pull ** 2,
    angle: angle + Math.PI / 2,
  };
}

/** Where a chain is thrown from: just off the screen edge around the target, spread evenly with some jitter. */
export function chainOrigins(
  count: number,
  width: number,
  height: number,
  random: () => number,
): IArenaPoint2[] {
  const reach = Math.hypot(width, height) * 0.6;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (random() - 0.5) * 0.5 - Math.PI / 2;
    return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach };
  });
}
