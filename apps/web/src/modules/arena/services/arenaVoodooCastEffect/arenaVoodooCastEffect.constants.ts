/**
 * The voodoo fireball: the caster gathers fire until `release` (share of the flight time before the hit), the
 * ball reaches the target at the hit, and the flames left behind rise and fade until the end.
 */
export const VOODOO_CAST_HIT_MS = 600;

export const VOODOO_CAST_DURATION_MS = 1500;

export const VOODOO_CAST_RELEASE_MS = 230;

/** The fire around the caster and along the flight, in token radii beyond them (sides, above, below). */
export const VOODOO_CAST_FIELD = { side: 3, above: 4.5, below: 2 } as const;
