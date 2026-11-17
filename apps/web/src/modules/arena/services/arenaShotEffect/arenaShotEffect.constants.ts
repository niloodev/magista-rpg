/** Length of the shot on the attacker, in milliseconds. */
export const SHOT_DURATION_MS = 1500;

/** Share of the animation spent pulling the gun out (it pops in and swings to aim). */
export const SHOT_DRAW = 0.16;

/** The trigger is pulled here: between the draw and this, the token holds its aim (the hammer goes back). */
export const SHOT_FIRE = 0.42;

/** The gun is put away from here on. */
export const SHOT_HOLSTER = 0.82;

/** How long the bolt takes to cross to the target, in milliseconds. */
export const SHOT_TRAVEL_MS = 70;

/** When the bolt reaches the target (its impact starts here). */
export const SHOT_HIT_MS = Math.round(SHOT_DURATION_MS * SHOT_FIRE + SHOT_TRAVEL_MS);

export const SHOT_MUZZLE_SPARKS = 26;

export const SHOT_SMOKE_PUFFS = 16;

/** Burning flecks of powder thrown out with the blast. */
export const SHOT_EMBERS = 18;

/** The board ripple at the muzzle when it fires. */
export const SHOT_BLAST = { radii: 3, durationMs: 520, amplitude: 22, wavelength: 80 } as const;

export const SHOT_COLORS = {
  core: 0xffffff,
  gold: 0xffd66b,
  amber: 0xffa53d,
  fire: 0xff6a1f,
  flash: 0xfff1b8,
  smoke: 0x8f8a86,
  steel: 0x2b2d33,
  steelLight: 0x5d616c,
  steelEdge: 0x0b0c0f,
  grip: 0x5a3a24,
  gripLight: 0x7a5236,
  brass: 0xd8a640,
} as const;
