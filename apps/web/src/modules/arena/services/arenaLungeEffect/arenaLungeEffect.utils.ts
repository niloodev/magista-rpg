import { phase } from "@/modules/arena/services/arenaTokenEffects";
import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import { LUNGE_PHASES } from "./arenaLungeEffect.constants";

const easeInCubic = (t: number) => t * t * t;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * How far along the attack line the attacker is at progress `t` (map pixels; negative while winding up): it
 * pulls back, dashes to the target edge, holds the hit for a beat and slides home.
 */
export function lungeDistance(t: number, reach: number, pullBack: number): number {
  if (t < LUNGE_PHASES.windup) return -pullBack * easeOutCubic(phase(t, 0, LUNGE_PHASES.windup));
  if (t < LUNGE_PHASES.hit) {
    const dash = easeInCubic(phase(t, LUNGE_PHASES.windup, LUNGE_PHASES.hit));
    return -pullBack + (reach + pullBack) * dash;
  }
  if (t < LUNGE_PHASES.hold) return reach;
  return reach * (1 - easeOutCubic(phase(t, LUNGE_PHASES.hold, 1)));
}

/**
 * How far the attacker goes: to the target edge (overlapping it a little), never past half way when the target
 * is very close.
 */
export function lungeReach(toward: IArenaPoint2, attackerRadius: number, targetRadius: number) {
  const distance = Math.hypot(toward.x, toward.y);
  const stop = (attackerRadius + targetRadius) * 0.6;
  return Math.max(distance - stop, distance * 0.4);
}
