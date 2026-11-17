/** Length of the whole spell on the target, in milliseconds (an ultimate takes its time). */
export const ENTROPIA_DURATION_MS = 4600;

/**
 * Phases of the spell (shares of the animation): the world goes dark and red, a black hole opens above the
 * target, chains fly in from the edges and bind it, the verses of the poem appear, everything is pulled in (the
 * image of the board bends and twists), the hole collapses to a point, it bursts, and the ash settles.
 */
export const ENTROPIA_PHASES = {
  dark: 0.07,
  form: 0.1,
  bind: 0.2,
  poem: 0.28,
  pull: 0.46,
  collapse: 0.66,
  burst: 0.71,
  settle: 0.84,
} as const;

/** Chains thrown from the edges of the screen at the target, and the length of one link (in screen pixels). */
export const ENTROPIA_CHAINS = 6;

export const ENTROPIA_LINK_PX = 22;

/** Share of the bind phase each chain takes to fly in. */
export const ENTROPIA_THROW_SPAN = 0.45;

/** Runes of the poem written in a ring around the black hole, then sucked into it. */
export const ENTROPIA_RUNE_RING = 16;

/**
 * Shapes of the runes (Elder Futhark), each a list of strokes in a box one unit tall centered on (0, 0), y down,
 * as flat point lists for `Graphics.poly`.
 */
export const ENTROPIA_RUNES: readonly (readonly (readonly number[])[])[] = [
  [
    [0, -0.5, 0, 0.5],
    [0, -0.3, 0.32, -0.5],
    [0, -0.05, 0.32, -0.25],
  ],
  [[-0.2, 0.5, -0.2, -0.5, 0.24, -0.2, 0.24, 0.5]],
  [
    [0, -0.5, 0, 0.5],
    [0, -0.25, 0.3, 0, 0, 0.25],
  ],
  [
    [0, -0.5, 0, 0.5],
    [0, -0.5, 0.3, -0.3],
    [0, -0.2, 0.3, 0],
  ],
  [
    [0, -0.5, 0, 0.5],
    [0, -0.5, 0.3, -0.28, 0, -0.05, 0.3, 0.5],
  ],
  [[0.24, -0.4, -0.16, 0, 0.24, 0.4]],
  [
    [-0.3, -0.5, 0.3, 0.5],
    [0.3, -0.5, -0.3, 0.5],
  ],
  [
    [-0.2, -0.5, -0.2, 0.5],
    [0.2, -0.5, 0.2, 0.5],
    [-0.2, -0.15, 0.2, 0.15],
  ],
  [
    [0, -0.5, 0, 0.5],
    [-0.25, -0.1, 0.25, 0.15],
  ],
  [
    [-0.05, -0.4, -0.3, -0.15, -0.05, 0.1],
    [0.05, -0.1, 0.3, 0.15, 0.05, 0.4],
  ],
  [
    [0, -0.5, 0, 0.5],
    [0, -0.5, 0.25, -0.35],
    [0, 0.5, -0.25, 0.35],
  ],
  [
    [0, -0.5, 0, 0.5],
    [0, -0.1, -0.3, -0.45],
    [0, -0.1, 0.3, -0.45],
  ],
  [[0.25, -0.5, -0.2, -0.15, 0.2, 0.15, -0.25, 0.5]],
  [
    [0, -0.5, 0, 0.5],
    [-0.3, -0.2, 0, -0.5, 0.3, -0.2],
  ],
  [[-0.3, -0.5, -0.3, 0.5, 0.3, -0.5, 0.3, 0.5, -0.3, -0.5]],
  [
    [0, -0.5, 0, 0.5],
    [-0.28, -0.5, 0.28, 0.5],
  ],
];

/**
 * Particles of the accretion disk, motes pulled off the target, fragments of the burst, ash after it, light
 * spiraling into the hole from the whole screen and sparks where each chain bites.
 */
export const ENTROPIA_DISK = 90;

export const ENTROPIA_MOTES = 26;

export const ENTROPIA_FRAGMENTS = 60;

export const ENTROPIA_ASH = 40;

export const ENTROPIA_INFALL = 54;

export const ENTROPIA_BITE_SPARKS = 8;

/**
 * How much bigger the black hole (and its darkness, disk and runes) grows over a group of targets, per token
 * radius they spread, and at most.
 */
export const ENTROPIA_GROUP_GROWTH = 0.45;

export const ENTROPIA_GROUP_MAX = 2.6;

/** Height of the black hole above the target, in token radii. */
export const ENTROPIA_HOLE_LIFT = 2.4;

export const ENTROPIA_SHOCKWAVE = {
  radii: 10,
  durationMs: 1000,
  amplitude: 60,
  wavelength: 180,
} as const;

/** Key of the screen part: an area spell plays it once. */
export const ENTROPIA_SCREEN_KEY = "entropia-poema";

export const ENTROPIA_COLORS = {
  black: 0x000000,
  void: 0x07020a,
  iron: 0x2a1418,
  rust: 0x5c1a22,
  blood: 0x7f0d1e,
  crimson: 0xb3122f,
  ruby: 0xe42a63,
  ember: 0xff5a36,
  hot: 0xffb4a8,
  white: 0xfff1f0,
  ash: 0x4a3a3e,
} as const;

/** Identity color matrix (5×4). */
export const ENTROPIA_IDENTITY_MATRIX = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

/** The world drained of color into black and red, darker. */
export const ENTROPIA_DRAIN_MATRIX = [
  0.5, 0.42, 0.1, 0, 0.02, 0.06, 0.12, 0.03, 0, 0, 0.06, 0.1, 0.03, 0, 0, 0, 0, 0, 1, 0,
];

/** The target under the pull: colors drained and reddened. */
export const ENTROPIA_TOKEN_MATRIX = [
  0.7, 0.35, 0.1, 0, 0.04, 0.12, 0.3, 0.06, 0, 0, 0.1, 0.2, 0.25, 0, 0, 0, 0, 0, 1, 0,
];
