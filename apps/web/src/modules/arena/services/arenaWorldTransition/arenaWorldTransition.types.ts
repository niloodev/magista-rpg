/** Which way the camera flies: up through the clouds (everything shrinks) or down through them (it all grows). */
export type WorldFlight = "out" | "in";

export interface IArenaWorldTransitionOptions {
  seed: number;
  /** The light mode plays a short passage. */
  lite: boolean;
  flight: WorldFlight;
  /** The screen size right now (screen pixels). */
  size: () => { width: number; height: number };
}

export type WorldTransitionPhase = "idle" | "approach" | "covered" | "depart" | "done";

/** How long each part of the passage lasts (ms). */
export interface IWorldTransitionTiming {
  approach: number;
  hold: number;
  depart: number;
}
