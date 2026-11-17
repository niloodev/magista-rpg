import type { ISoundWave } from "@/modules/arena/services/arenaSoundWave";
import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/**
 * One side of the water splitting around the target (`side` 1 or -1): it hits the side facing the blow, wraps
 * around the token at `radius` and runs on past it, fanning out, `count` points long. `heading` is where the blow
 * goes.
 */
export function wavePath(
  heading: number,
  side: 1 | -1,
  radius: number,
  count: number,
): IArenaPoint2[] {
  return Array.from({ length: count }, (_, index) => {
    const along = index / (count - 1);
    const sweep = Math.PI * 0.95 * Math.min(along / 0.7, 1);
    const angle = heading + Math.PI - side * sweep;
    const reach = radius * (1 + 1.6 * Math.max(along - 0.55, 0) ** 1.4);
    return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach * 0.8 };
  });
}

/**
 * One arm of a waterspout around the target: from its foot on the floor (`floor`, below the token center) it
 * winds up around the token, opening like a funnel, to `height`, `count` points long. `start` turns it (it
 * spins).
 */
export function spoutPath(
  start: number,
  radius: number,
  height: number,
  floor: number,
  turns: number,
  count: number,
): IArenaPoint2[] {
  return Array.from({ length: count }, (_, index) => {
    const along = index / (count - 1);
    const angle = start + along * turns * Math.PI * 2;
    const reach = radius * (0.55 + 1.3 * along ** 1.4);
    return {
      x: Math.cos(angle) * reach,
      y: floor - along * height + Math.sin(angle) * reach * 0.32,
    };
  });
}

/** The rings of water on the map: one at the crash, a bigger one at the slam (seconds, token radii). */
export function passingRipples(seconds: number, crash: number, slam: number): ISoundWave[] {
  const waves: ISoundWave[] = [];
  for (const [born, span, reach, strength] of [
    [crash, 0.6, 9, 0.7],
    [slam, 0.8, 14, 1],
    [slam + 0.12, 0.8, 10, 0.6],
  ] as const) {
    const life = (seconds - born) / span;
    if (life <= 0 || life >= 1) continue;
    waves.push({
      radius: 0.6 + reach * (1 - (1 - life) ** 2),
      strength: strength * Math.sin(Math.PI * life),
      thickness: 0.8 + 1.6 * life,
      spread: Math.PI * 1.01,
    });
  }
  return waves;
}
