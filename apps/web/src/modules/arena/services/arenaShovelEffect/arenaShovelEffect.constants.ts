/** Length of the shovel impact on the target, in milliseconds (the shovel itself swings in the attacker's hands). */
export const SHOVEL_DURATION_MS = 1100;

/** Sparks of the metal hitting, dust thrown up, dust rolling out on the ground and pebbles bouncing off. */
export const SHOVEL_SPARKS = 30;

export const SHOVEL_DUST = 16;

export const SHOVEL_DUST_RING = 22;

export const SHOVEL_PEBBLES = 14;

/** Cracks in the ground under the target. */
export const SHOVEL_CRACKS = 7;

export const SHOVEL_SHOCKWAVE = {
  radii: 4.5,
  durationMs: 600,
  amplitude: 36,
  wavelength: 110,
} as const;

export const SHOVEL_COLORS = {
  white: 0xffffff,
  steel: 0x9ca3af,
  shine: 0xe5e7eb,
  dust: 0xc8a97e,
  dirt: 0x7c5a3a,
  crack: 0x2b1d12,
  crackEdge: 0xa47b4f,
  spark: 0xfff3c4,
} as const;
