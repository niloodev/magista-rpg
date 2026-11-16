/** Length of the attacker animation, in milliseconds. */
export const LUNGE_DURATION_MS = 820;

/** When the attacker reaches the target (the hit animation on the target starts here). */
export const LUNGE_HIT_MS = 330;

/** Phases of the lunge (shares of the animation): wind up, dash, impact hold, way back. */
export const LUNGE_PHASES = {
  windup: 0.22,
  hit: LUNGE_HIT_MS / LUNGE_DURATION_MS,
  hold: 0.5,
} as const;

/** Positions kept for the trail. */
export const LUNGE_TRAIL_LENGTH = 14;

/** Afterimages left along the dash. */
export const LUNGE_GHOSTS = 4;

export const LUNGE_STREAKS = 16;

export const LUNGE_COLORS = {
  white: 0xffffff,
  rubyLight: 0xf07a9b,
  ruby: 0xe42a63,
} as const;
