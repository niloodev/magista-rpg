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

/** Trail colors of each kind of lunge: the white core, the light edge and the main color. */
export const LUNGE_PALETTES = {
  ruby: { white: 0xffffff, rubyLight: 0xf07a9b, ruby: 0xe42a63 },
  voodoo: { white: 0xeaffc8, rubyLight: 0x9dff3c, ruby: 0x1fbf45 },
  floral: { white: 0xfff0f6, rubyLight: 0xf9a8d4, ruby: 0xec4899 },
  earth: { white: 0xfff7e6, rubyLight: 0xd6b48a, ruby: 0x8b6b45 },
} as const;

/** Petals shed along the dash by a floral lunge, and their colors from light to deep pink. */
export const LUNGE_PETALS = 30;

export const LUNGE_PETAL_COLORS = [0xffe4f1, 0xf9a8d4, 0xf472b6, 0xec4899] as const;
