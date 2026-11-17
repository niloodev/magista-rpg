/** Length of the whole spell on the target, in milliseconds (an ultimate takes its time). */
export const VITAE_DURATION_MS = 4400;

/**
 * Phases of the spell (shares of the animation): the light of dawn falls on the board, a seed of light comes
 * down on the target, the Flower of Life is woven around it while the heart beats and everyone's light comes to
 * it, the flower folds into the target, it blooms (true life: the curses break, petals take the screen), and
 * everything settles in a warm glow.
 */
export const VITAE_PHASES = {
  dawn: 0.08,
  seed: 0.06,
  weave: 0.17,
  fold: 0.6,
  bloom: 0.66,
  settle: 0.78,
} as const;

/** Heartbeats (shares of the animation): each is a "lub" and, a moment later, a softer "dub". */
export const VITAE_BEATS = [0.17, 0.31, 0.45, 0.58] as const;

/** Distance between the "lub" and the "dub" of a heartbeat (share of the animation). */
export const VITAE_DUB_GAP = 0.035;

/** How long a beat glows (share of the animation). */
export const VITAE_BEAT_WIDTH = 0.06;

/** Vines growing from the target, and how many leaves each one sprouts. */
export const VITAE_VINES = 7;

export const VITAE_LEAVES_PER_VINE = 5;

/** Petals bursting from the bloom, curse shards torn off the target, pollen rising after. */
export const VITAE_PETALS = 46;

export const VITAE_CURSE_SHARDS = 14;

export const VITAE_POLLEN = 30;

export const VITAE_SWIRL_LEAVES = 18;

/** Lights of everyone (Vitae Populi) rising from the whole screen to the target while the flower is woven. */
export const VITAE_SOULS = 64;

/** Petals storming the whole screen at the bloom, and the ones falling slowly after. */
export const VITAE_SCREEN_PETALS = 70;

export const VITAE_FALLING_PETALS = 34;

/**
 * How much bigger the Flower of Life, the spotlights and the bloom grow over a group of targets, per token
 * radius they spread, and at most.
 */
export const VITAE_GROUP_GROWTH = 0.5;

export const VITAE_GROUP_MAX = 3;

/** Spotlights pouring from above the screen onto the target while the spell lasts. */
export const VITAE_BEAMS = 5;

/** Rays of light turning around the target at the bloom, across the screen. */
export const VITAE_RAYS = 14;

export const VITAE_SHOCKWAVE = {
  radii: 8,
  durationMs: 1100,
  amplitude: 26,
  wavelength: 220,
  brightness: 1.25,
} as const;

/** Key of the screen part: an area spell plays it once. */
export const VITAE_SCREEN_KEY = "vitae-unius";

/** Colors of life: dawn light, gold, leaves and the pink of the Calabrias flowers. */
export const VITAE_COLORS = {
  white: 0xffffff,
  cream: 0xfff7d6,
  gold: 0xfcd34d,
  amber: 0xf59e0b,
  leaf: 0xa7f3d0,
  spring: 0xbef264,
  mint: 0xecfccb,
  emerald: 0x34d399,
  jade: 0x10b981,
  deep: 0x065f46,
  blossom: 0xf9a8d4,
  rose: 0xf472b6,
  curse: 0x2e1065,
  curseEdge: 0x7c3aed,
} as const;

/** Identity color matrix (5×4). */
export const VITAE_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** The world in living light: a little brighter, lush green with a touch of gold. */
export const VITAE_WARM_MATRIX = [
  1.02, 0.05, 0, 0, 0.01, 0.03, 1.2, 0.03, 0, 0.05, 0, 0.04, 0.9, 0, 0.01, 0, 0, 0, 1, 0,
];

/** The target glowing with life: much brighter and green. */
export const VITAE_RADIANT_MATRIX = [
  1.18, 0.1, 0, 0, 0.05, 0.08, 1.6, 0.08, 0, 0.16, 0, 0.12, 1.12, 0, 0.06, 0, 0, 0, 1, 0,
];

/**
 * Layers of the flower of light that opens over the target, from the outer in: petals, length (in token radii),
 * color, the lighter heart of each petal, how strong it is, how fast it turns and how late it opens.
 */
export const VITAE_LOTUS_LAYERS = [
  { petals: 12, length: 2.3, color: 0x10b981, heart: 0x6ee7b7, alpha: 0.6, spin: 0.18, delay: 0 },
  {
    petals: 10,
    length: 1.75,
    color: 0x34d399,
    heart: 0xbef264,
    alpha: 0.7,
    spin: -0.3,
    delay: 0.012,
  },
  {
    petals: 8,
    length: 1.2,
    color: 0xa7f3d0,
    heart: 0xecfccb,
    alpha: 0.8,
    spin: 0.45,
    delay: 0.024,
  },
  {
    petals: 6,
    length: 0.7,
    color: 0xecfccb,
    heart: 0xffffff,
    alpha: 0.9,
    spin: -0.6,
    delay: 0.034,
  },
] as const;
