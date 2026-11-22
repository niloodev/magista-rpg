import { WORLD_TRANSITION_ZOOM } from "./arenaWorldTransition.constants";
import type {
  IWorldTransitionTiming,
  WorldFlight,
  WorldTransitionPhase,
} from "./arenaWorldTransition.types";

/** Eases in: slow start, fast end (the camera picking up speed). */
export const easeInFlight = (t: number) => t * t * t;

/** Eases out: fast start, slow end (the camera settling on its spot). */
export const easeOutFlight = (t: number) => 1 - (1 - t) ** 3;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** How thick the clouds are `elapsed` ms into a phase: they thicken to white approaching and clear departing. */
export function transitionDensity(
  phase: WorldTransitionPhase,
  elapsed: number,
  timing: IWorldTransitionTiming,
): number {
  if (phase === "approach") return easeInFlight(clamp01(elapsed / timing.approach)) ** 0.6;
  if (phase === "covered") return 1;
  if (phase === "depart") {
    const t = clamp01(elapsed / timing.depart);
    return 1 - t * t * (3 - 2 * t);
  }
  return 0;
}

/**
 * How far into the approach the clouds would be at `density` (the inverse of the approach curve), so a flight
 * that turns back while clearing thickens again from where it is instead of jumping.
 */
export function approachElapsedFor(density: number, timing: IWorldTransitionTiming): number {
  return clamp01(density) ** (1 / 1.8) * timing.approach;
}

/**
 * The scale of the clouds after `seconds` more of flight: one steady pace (in log scale) the way the camera flies,
 * shrinking up and growing down, within the range of both flights (so turning back never jumps).
 */
export function stepCloudZoom(
  zoom: number,
  flight: WorldFlight,
  seconds: number,
  timing: IWorldTransitionTiming,
): number {
  const { start, end } = WORLD_TRANSITION_ZOOM[flight];
  const total = (timing.approach + timing.hold + timing.depart) / 1000;
  const next = zoom * (end / start) ** (seconds / total);
  return Math.min(Math.max(next, WORLD_TRANSITION_ZOOM.out.end), WORLD_TRANSITION_ZOOM.in.end);
}
