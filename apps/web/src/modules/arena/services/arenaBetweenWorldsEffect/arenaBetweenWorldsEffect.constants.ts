/** Length of the whole spell on the target, in milliseconds (an ultimate takes its time). */
export const BETWEEN_DURATION_MS = 5600;

/**
 * Phases of the spell (shares of the animation): the world sinks into deep water, the swarm streams in from
 * beyond the screen and whirls around the target, the wings of the god unfold above it out of the swarm, their
 * eyes open, the water under the target turns into a whirlpool (the passage), the wings clap and the target is
 * dragged through, then spat back in a column of water while the swarm scatters.
 */
export const BETWEEN_PHASES = {
  drown: 0.1,
  swarm: 0.03,
  gather: 0.26,
  wings: 0.32,
  eyes: 0.44,
  pull: 0.5,
  hit: 0.66,
  surge: 0.69,
  settle: 0.86,
} as const;

/** How long the wings take to clap shut, ending at the hit (share of the spell), and how open they stay after. */
export const BETWEEN_CLAP = 0.03;

export const BETWEEN_FOLDED = 0.08;

/** Butterflies whirling around the targets, and those that leave the whirl to form the wings of the god. */
export const BETWEEN_VORTEX = 72;

export const BETWEEN_WING_BUTTERFLIES = 64;

/** Currents of water streaming in from beyond the screen, carrying the swarm. */
export const BETWEEN_STREAMS = 6;

/** Most currents over a group (two per target, at least the usual). */
export const BETWEEN_STREAMS_MAX = 12;

/** Arms of the whirlpool, and drops of water thrown up by the surge. */
export const BETWEEN_ARMS = 3;

export const BETWEEN_DROPLETS = 64;

export const BETWEEN_SPRAY = 30;

/** Rings of water racing out over the floor when the target is spat back. */
export const BETWEEN_SPLASH_RINGS = 2;

/**
 * How much bigger the wings, the whirlpool and the column grow over a group of targets, per token radius they
 * spread, and at most.
 */
export const BETWEEN_GROUP_GROWTH = 0.5;

export const BETWEEN_GROUP_MAX = 2.6;

/** The water and the whirlpool lie on the floor, seen at an angle. */
export const BETWEEN_FLOOR_TILT = 0.42;

/** The wings of the god: half their span and how high above the target their root is, in token radii. */
export const BETWEEN_WINGSPAN = 5.2;

export const BETWEEN_WINGS_LIFT = 3.8;

/**
 * The right wings of the god (the left mirror them), as loops of control points in half-spans from the root:
 * the forewing reaching up and out, the hindwing rounding down.
 */
export const BETWEEN_FOREWING = [
  { x: 0.04, y: -0.12 },
  { x: 0.2, y: -0.55 },
  { x: 0.48, y: -0.9 },
  { x: 0.8, y: -1 },
  { x: 0.98, y: -0.88 },
  { x: 0.92, y: -0.58 },
  { x: 0.72, y: -0.3 },
  { x: 0.4, y: -0.1 },
  { x: 0.06, y: 0.02 },
] as const;

export const BETWEEN_HINDWING = [
  { x: 0.06, y: 0.04 },
  { x: 0.42, y: -0.04 },
  { x: 0.68, y: 0.08 },
  { x: 0.74, y: 0.32 },
  { x: 0.6, y: 0.56 },
  { x: 0.38, y: 0.74 },
  { x: 0.18, y: 0.68 },
  { x: 0.07, y: 0.4 },
  { x: 0.03, y: 0.16 },
] as const;

/** Where the veins of each wing run to from the root, in half-spans. */
export const BETWEEN_VEINS = [
  { x: 0.8, y: -0.97 },
  { x: 0.95, y: -0.72 },
  { x: 0.66, y: -0.26 },
  { x: 0.7, y: 0.22 },
  { x: 0.52, y: 0.62 },
  { x: 0.22, y: 0.66 },
] as const;

/** The eyes on the wings (where they are and how big, in half-spans): one on each forewing and hindwing. */
export const BETWEEN_EYES = [
  { x: 0.6, y: -0.62, radius: 0.13 },
  { x: 0.4, y: 0.34, radius: 0.1 },
] as const;

/** Points along each wing outline and each arm of the whirlpool. */
export const BETWEEN_OUTLINE_POINTS = 64;

export const BETWEEN_ARM_POINTS = 32;

export const BETWEEN_SHOCKWAVE = {
  radii: 10,
  durationMs: 1100,
  amplitude: 46,
  wavelength: 220,
} as const;

/** Key of the screen part: an area spell plays it once. */
export const BETWEEN_SCREEN_KEY = "between-worlds";

/** Antropozohl's colors: the black of deep water, dark blues, a pale sky blue, ice and white. */
export const BETWEEN_COLORS = {
  abyss: 0x020617,
  navy: 0x0b1a4a,
  midnight: 0x14286e,
  deep: 0x1e3a8a,
  blue: 0x2f5fd8,
  sky: 0x7fb2ff,
  ice: 0xcfe3ff,
  white: 0xffffff,
} as const;

/** The world sunk into deep water: dark, cold and blue. */
export const BETWEEN_DROWN_MATRIX = [
  0.2, 0.1, 0.06, 0, 0, 0.06, 0.28, 0.14, 0, 0.01, 0.08, 0.22, 0.66, 0, 0.06, 0, 0, 0, 1, 0,
];

/** The target held under the water: dimmed and blue. */
export const BETWEEN_HELD_MATRIX = [
  0.35, 0.1, 0.1, 0, 0, 0.05, 0.45, 0.15, 0, 0.02, 0.1, 0.25, 0.85, 0, 0.1, 0, 0, 0, 1, 0,
];

/** The target spat back between the worlds: lit pale blue and white. */
export const BETWEEN_SURFACED_MATRIX = [
  1.1, 0.15, 0.2, 0, 0.1, 0.1, 1.2, 0.2, 0, 0.14, 0.15, 0.25, 1.45, 0, 0.24, 0, 0, 0, 1, 0,
];

export const BETWEEN_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
