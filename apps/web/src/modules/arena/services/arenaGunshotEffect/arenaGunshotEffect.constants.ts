/** Length of the impact, in milliseconds. */
export const GUNSHOT_DURATION_MS = 1300;

/** Sparks and debris blown out of the far side, where the bullet exits. */
export const GUNSHOT_EXIT_SPARKS = 34;

/** Sparks splashing back toward the shooter at the entry. */
export const GUNSHOT_ENTRY_SPARKS = 14;

export const GUNSHOT_SHARDS = 16;

export const GUNSHOT_DUST = 10;

export const GUNSHOT_WISPS = 5;

/** The board ripple: a heavy hit that shakes the table. */
export const GUNSHOT_SHOCKWAVE = {
  radii: 4.2,
  durationMs: 620,
  amplitude: 30,
  wavelength: 100,
} as const;

export const GUNSHOT_COLORS = {
  core: 0xffffff,
  hot: 0xffe08a,
  ember: 0xff8a3c,
  fire: 0xff5a1f,
  ring: 0xf5f0e6,
  dust: 0x9b948c,
  shard: 0x3b3a40,
  hole: 0x0d0a0c,
  holeRim: 0x5a4a3a,
  smoke: 0x6f6a66,
} as const;
