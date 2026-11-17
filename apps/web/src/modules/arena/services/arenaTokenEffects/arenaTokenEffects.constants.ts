export const EFFECT_COLORS = {
  ruby: 0xe42a63,
  rubyLight: 0xf07a9b,
  rose: 0xf9a8c4,
  tealDeep: 0x134e4a,
  teal: 0x14b8a6,
  tealLight: 0x2dd4bf,
  white: 0xffffff,
  black: 0x000000,
  gold: 0xfbbf24,
  voodoo: 0x22c94a,
  geometry: 0x3b82f6,
  nox: 0x8b5cf6,
  abyss: 0x3d6fe8,
} as const;

/** Length of each animation, in milliseconds. */
export const EFFECT_DURATION_MS = {
  lite: 1000,
} as const;

/**
 * Share of a big spell's animation from which its screen part dissolves (everything still in the air fades out
 * instead of vanishing when it ends).
 */
export const ARENA_FX_FADE_FROM = 0.9;

/** What is left of an animation when it ends fades away for this long instead of vanishing, in milliseconds. */
export const EFFECT_LINGER_MS = 450;

/** Most animations playing on one token; a new one past this ends the oldest. */
export const EFFECT_MAX_PER_TOKEN = 3;

/** A status change this close to an animation on the same token does not float a second number. */
export const EFFECT_FLOAT_QUIET_MS = 1500;

/** Height of the floating amount on screen, in CSS pixels. */
export const EFFECT_NUMBER_PX = 22;

export const EFFECT_NUMBER_BASE_PX = 44;

/** Most tokens of one change that get the rich animation (the rest flash), so an area attack stays light. */
export const EFFECT_RICH_BUDGET = 10;

/** How far past the edges of the screen the screen part of a spell reaches (share of the screen), so its edges never show. */
export const ARENA_FX_FIELD_MARGIN = 0.15;

/** Most board ripples alive at once (a new one ends the oldest). */
export const EFFECT_MAX_SHOCKWAVES = 2;
