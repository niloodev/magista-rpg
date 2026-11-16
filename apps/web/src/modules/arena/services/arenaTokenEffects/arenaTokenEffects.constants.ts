export const EFFECT_COLORS = {
  ruby: 0xe42a63,
  rubyLight: 0xf07a9b,
  rose: 0xf9a8c4,
  tealDeep: 0x134e4a,
  teal: 0x14b8a6,
  tealLight: 0x2dd4bf,
  white: 0xffffff,
  black: 0x000000,
} as const;

/** Length of each animation, in milliseconds. */
export const EFFECT_DURATION_MS = {
  lite: 1000,
} as const;

/** Most animations playing on one token; a new one past this ends the oldest. */
export const EFFECT_MAX_PER_TOKEN = 3;

/** A status change this close to an animation on the same token does not float a second number. */
export const EFFECT_FLOAT_QUIET_MS = 1500;

/** Height of the floating amount on screen, in CSS pixels. */
export const EFFECT_NUMBER_PX = 22;

export const EFFECT_NUMBER_BASE_PX = 44;

/** Most tokens of one change that get the rich animation (the rest flash), so an area attack stays light. */
export const EFFECT_RICH_BUDGET = 10;

/** Most board ripples alive at once (a new one ends the oldest). */
export const EFFECT_MAX_SHOCKWAVES = 2;
