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
  floral: { core: 0xffffff, glow: 0xf9a8d4, trail: 0xec4899 },
} as const;

/** Palettes whose orb is a flower bud: petals spiral into the caster and fall from the bud along its flight. */
export const CAST_FLORAL_PALETTES: ReadonlySet<keyof typeof CAST_PALETTES> = new Set(["floral"]);

/** Petals of a floral cast: drawn in while it gathers, then shed behind the bud. */
export const CAST_FLORAL = { gather: 26, shed: 30 } as const;

/** Petal colors of a floral cast, light to deep pink. */
export const CAST_PETAL_STOPS = [0xffe4f1, 0xf9a8d4, 0xf472b6, 0xec4899] as const;
