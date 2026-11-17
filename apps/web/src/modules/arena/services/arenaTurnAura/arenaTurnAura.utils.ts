import { TURN_AURA_FADE_MS, TURN_BOB_PERIOD_MS, TURN_LIFT } from "./arenaTurnAura.constants";

const smooth = (value: number) => {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * How present the aura is (0 to 1): fading in from `start`, and out from `leftAt` when the turn moved on.
 */
export function auraPresence(now: number, start: number, leftAt: number | null): number {
  const rising = smooth((now - start) / TURN_AURA_FADE_MS);
  if (leftAt === null) return rising;
  return Math.min(rising, 1 - smooth((now - leftAt) / TURN_AURA_FADE_MS));
}

/**
 * Height of the floating token: it rises to its hover height while the aura arrives, bobs gently around it, and
 * settles back as the aura leaves. Big tokens are capped, so they float as little as the usual ones.
 */
export function floatLift(size: number, elapsed: number, presence: number): number {
  const hover = Math.min(size * TURN_LIFT.hover, TURN_LIFT.max);
  const bob = Math.min(size * TURN_LIFT.bob, TURN_LIFT.bobMax);
  const wave = Math.sin((elapsed / TURN_BOB_PERIOD_MS) * Math.PI * 2);
  return (hover + bob * wave) * presence;
}

/**
 * A slow breath (0 to 1) for the glows, offset so ring and glow do not pulse together.
 */
export function breath(elapsed: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin((elapsed / TURN_BOB_PERIOD_MS) * Math.PI * 2 + offset);
}
