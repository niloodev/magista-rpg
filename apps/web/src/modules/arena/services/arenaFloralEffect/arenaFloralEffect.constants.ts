/** Length of each variant, in milliseconds. */
export const FLORAL_DURATION_MS = { strike: 1400, cast: 1800 } as const;

/** The flower opens until here, holds, and bursts into petals here (shares of the animation). */
export const FLORAL_PHASES = {
  strike: { open: 0.22, burst: 0.36 },
  cast: { open: 0.32, burst: 0.55 },
} as const;

/** Petal rings of the big flower, outside in: how many petals, how long, how wide. */
export const FLORAL_LAYERS = [
  { petals: 8, length: 1, width: 0.42 },
  { petals: 6, length: 0.74, width: 0.38 },
  { petals: 5, length: 0.5, width: 0.32 },
] as const;

export const FLORAL_BURST_PETALS = 46;

/** Petals swept across the token by the blow of the strike variant. */
export const FLORAL_SWEEP_PETALS = 22;

/** Petals raining from above in the cast variant. */
export const FLORAL_RAIN_PETALS = 34;

/** Little flowers popping in a ring on the floor in the cast variant. */
export const FLORAL_RING_BLOSSOMS = 10;

export const FLORAL_POLLEN = 24;

export const FLORAL_COLORS = {
  white: 0xffffff,
  blush: 0xffe4f1,
  light: 0xf9a8d4,
  pink: 0xf472b6,
  deep: 0xec4899,
  rose: 0xbe185d,
  gold: 0xfde68a,
  pollen: 0xfbbf24,
} as const;

/** Petal colors, light to deep pink. */
export const FLORAL_PETAL_STOPS = [0xffe4f1, 0xf9a8d4, 0xf472b6, 0xec4899] as const;
