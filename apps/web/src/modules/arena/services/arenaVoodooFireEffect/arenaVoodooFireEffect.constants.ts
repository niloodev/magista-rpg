/** Length of each variant (how long the target burns), in milliseconds. */
export const VOODOO_DURATION_MS = { axe: 1500, fireball: 1500 } as const;

/** How long the flames keep rising and fade after the burning is over, in milliseconds. */
export const VOODOO_LINGER_MS = 1000;

/**
 * At most this many targets burn in a fluid of fire at once (each is a GPU simulation); in a bigger area spell the
 * others show the fire as ribbons of flame.
 */
export const VOODOO_FLUID_LIMIT = 3;

export const VOODOO_FLUID_KEY = "voodoo-fire-fluid";

/** Tongues of fire climbing over the target while it burns (green and red in turn). */
export const VOODOO_TONGUES = 7;

/**
 * The fire around the target, in token radii: how far it reaches to the sides, above (the flames rise) and
 * below.
 */
export const VOODOO_FIRE_FIELD = { side: 4.5, above: 7, below: 3 } as const;

/** The cuts of the axe across the token: delay (seconds), angle from the blow, length (token radii), bend, width. */
export const VOODOO_SLASHES = [
  { delay: 0, angle: 0.9, length: 1.35, bend: 0.14, width: 0.32 },
  { delay: 0.07, angle: -0.55, length: 1.2, bend: -0.12, width: 0.26 },
] as const;

/** How long a cut takes to flare across and to burn out, in seconds. */
export const VOODOO_SLASH_IN_S = 0.09;

export const VOODOO_SLASH_OUT_S = 0.32;

/** Sparks thrown off along each cut, and embers rising off the burning target. */
export const VOODOO_SLASH_SPARKS = 14;

export const VOODOO_EMBERS = 26;

/** Flames thrown out by the fireball blast. */
export const VOODOO_BLAST_FLAMES = 30;

export const VOODOO_SHOCKWAVE = {
  axe: { radii: 3, durationMs: 520, amplitude: 22, wavelength: 90 },
  fireball: { radii: 4, durationMs: 640, amplitude: 26, wavelength: 110 },
} as const;

/**
 * The voodoo flame from its hottest to its dying edge: white-yellow, lime, green, teal, violet, deep purple.
 */
export const VOODOO_FLAME_STOPS = [
  0xfdffe0, 0xd8ff5a, 0x7dff3a, 0x22c94a, 0x14b8a6, 0x7c3aed, 0x3b0d5c,
] as const;

export const VOODOO_COLORS = {
  violet: 0x8b5cf6,
  purple: 0x4c1d95,
  teal: 0x2dd4bf,
  gold: 0xfde047,
  core: 0xf4ffe0,
  bright: 0xc8ff5a,
  lime: 0x7dff3a,
  green: 0x22c94a,
  deep: 0x0b6b26,
  dark: 0x0a2410,
  smoke: 0x1a1024,
  wood: 0x5a3a24,
  woodLight: 0x7a5236,
  iron: 0x3a3f45,
  ironLight: 0x6d747d,
  ink: 0x0b0c0f,
} as const;
