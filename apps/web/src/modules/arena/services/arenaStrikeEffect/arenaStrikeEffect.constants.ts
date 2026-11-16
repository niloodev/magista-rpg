/** Length of the Golpe, in milliseconds. */
export const STRIKE_DURATION_MS = 950;

/** The three cuts: angle (radians), sideways offset and bend (shares of the token radius). */
export const STRIKE_SLASHES = [
  { angle: -0.62, offset: -0.22, bend: 0.12 },
  { angle: 0.58, offset: 0.05, bend: -0.1 },
  { angle: -0.78, offset: 0.32, bend: 0.14 },
] as const;

/** When each cut starts and how long it takes to sweep (shares of the animation). */
export const STRIKE_SLASH_START = 0.02;

export const STRIKE_SLASH_GAP = 0.075;

export const STRIKE_SLASH_SWEEP = 0.07;

export const STRIKE_SLASH_FADE = 0.2;

export const STRIKE_SPARKS_PER_SLASH = 10;

export const STRIKE_HOT_SPARKS_PER_SLASH = 5;

export const STRIKE_SHARDS = 12;

export const STRIKE_SMOKE = 5;

/** Radius of the ripple on the map, in token radii on screen. */
export const STRIKE_SHOCKWAVE_RADII = 3.4;

export const STRIKE_SHOCKWAVE_MS = 560;

export const STRIKE_COLORS = {
  white: 0xffffff,
  hot: 0xffd6e2,
  rubyLight: 0xf07a9b,
  ruby: 0xe42a63,
  rubyDeep: 0x8c1036,
  rubyDark: 0x5c0b25,
} as const;
