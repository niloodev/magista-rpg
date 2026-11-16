/** Length of the Fissura, in milliseconds. */
export const FISSURE_DURATION_MS = 1100;

export const FISSURE_CRACKS = 8;

export const FISSURE_SMOKE = 10;

export const FISSURE_RUNES = 7;

export const FISSURE_DUST_PER_RUNE = 5;

/** The glitch only redraws its slices this often (a new pattern each frame would be too costly). */
export const FISSURE_GLITCH_EVERY_MS = 70;

export const FISSURE_COLORS = {
  void: 0x060203,
  deep: 0x0b2f2c,
  tealDeep: 0x134e4a,
  teal: 0x14b8a6,
  tealLight: 0x2dd4bf,
  pale: 0xb8fff4,
  ruby: 0xe42a63,
} as const;
