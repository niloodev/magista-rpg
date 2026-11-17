/** How long the water crashes, lifts and slams the target, and how long its water keeps fading after, in milliseconds. */
export const PASSING_DURATION_MS = 2400;

export const PASSING_LINGER_MS = 1000;

/**
 * Moments of the attack, in seconds: the torrent crashes and splits around the target, a waterspout rises around
 * it and lifts it, the spout collapses and slams it into the floor, and the whirlpool left under it drains.
 */
export const PASSING_TIMES = {
  crashIn: 0.16,
  crashOut: 0.5,
  spout: 0.1,
  spoutFull: 0.55,
  collapse: 1.2,
  slam: 1.42,
  drain: 2.2,
} as const;

/** The status changes when the spout slams the target down, in milliseconds. */
export const PASSING_IMPACT_MS = PASSING_TIMES.slam * 1000;

/**
 * At most this many targets get the water (a fluid each) at once; in a bigger area attack the others show the
 * same water as ribbons.
 */
export const PASSING_FLUID_LIMIT = 3;

export const PASSING_FLUID_KEY = "passing-flow-fluid";

/** Key of the rings of water on the map: an area attack plays them once. */
export const PASSING_RIPPLE_KEY = "passing-flow-ripple";

/** The water around the target, in token radii: to the sides, above (the spout rises) and below. */
export const PASSING_FIELD = { side: 4.5, above: 8, below: 3 } as const;

/** How high the waterspout rises over the target, in token radii, and how many times its arms wind. */
export const PASSING_SPOUT = { height: 6, turns: 1.6, arms: 3 } as const;

/** Butterflies coming with the water, drops thrown by the crash and by the slam, and the fine spray. */
export const PASSING_BUTTERFLIES = 26;

export const PASSING_DROPLETS = 56;

export const PASSING_SLAM_DROPLETS = 48;

export const PASSING_SPRAY = 18;

/** Rings of water racing over the floor at the crash and at the slam. */
export const PASSING_RINGS = 3;

/** Points along each wave, each arm of the spout and each arm of the whirlpool. */
export const PASSING_WAVE_POINTS = 28;

export const PASSING_SPOUT_POINTS = 40;

export const PASSING_ARM_POINTS = 24;

export const PASSING_SHOCKWAVE = {
  crash: { radii: 5, durationMs: 650, amplitude: 34, wavelength: 120 },
  slam: { radii: 8, durationMs: 900, amplitude: 52, wavelength: 180 },
} as const;
