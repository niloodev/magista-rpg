/** Length of the cast, in milliseconds. */
export const CAST_DURATION_MS = 880;

/** When the orb reaches the target (its hit animation starts here). */
export const CAST_HIT_MS = 560;

/** The caster gathers light until here (share of the animation), then the orb flies. */
export const CAST_RELEASE = 0.3;

export const CAST_GATHER_MOTES = 14;

export const CAST_TRAIL_MOTES = 18;

/** Colors of each kind of cast: the orb core, its glow and the trail. */
export const CAST_PALETTES = {
  fissure: { core: 0xb8fff4, glow: 0x14b8a6, trail: 0x134e4a },
  ember: { core: 0xffffff, glow: 0xf9a8c4, trail: 0xe42a63 },
  clarity: { core: 0xffffff, glow: 0x2dd4bf, trail: 0x14b8a6 },
} as const;
