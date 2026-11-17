import { ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";

/** Length of the whole spell on the target, in milliseconds (an ultimate takes its time). */
export const DIVINE_DURATION_MS = 5000;

/**
 * Phases of the spell (shares of the animation): the heavens open (the world turns golden), a halo of flowing
 * energy forms above the target, streams of energy spiral down onto it, the call lands (a column of light: a blessing or a judgment), and the light rises away while feathers fall.
 */
export const DIVINE_PHASES = {
  open: 0.08,
  halo: 0.06,
  descend: 0.24,
  call: 0.6,
  impact: 0.64,
  settle: 0.8,
} as const;

/** Feathers of light falling after the call. */
export const DIVINE_PLUMES = 36;

/** Channels of energy from the halo down onto the targets, and out of the target at the call. */
export const DIVINE_DESCENT_CHANNELS = 5;

export const DIVINE_RELEASE_CHANNELS = 7;

/** Height of the halo above the target, in token radii, and its size. */
export const DIVINE_HALO = { lift: 4.4, radius: 2.6, squash: 0.32 } as const;

/** How much bigger everything grows over a group of targets, per token radius they spread, and at most. */
export const DIVINE_GROUP_GROWTH = 0.45;

export const DIVINE_GROUP_MAX = 2.6;

export const DIVINE_SHOCKWAVE = {
  heal: { radii: 8, durationMs: 1100, amplitude: 24, wavelength: 220 },
  damage: { radii: 9, durationMs: 900, amplitude: 52, wavelength: 170 },
} as const;

/** Key of the screen part: an area spell plays it once. */
export const DIVINE_SCREEN_KEY = "divine-call";

export const DIVINE_COLORS = {
  white: 0xffffff,
  cream: 0xfff8e1,
  light: 0xffe9a8,
  gold: 0xffc93c,
  amber: 0xf59e0b,
  deep: 0xb45309,
} as const;

/** Identity color matrix (5×4). */
export const DIVINE_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** The world under the divine light: brighter, golden. */
export const DIVINE_GOLDEN_MATRIX = [
  1.18, 0.08, 0, 0, 0.06, 0.04, 1.1, 0.02, 0, 0.04, 0, 0, 0.8, 0, 0, 0, 0, 0, 1, 0,
];

/** The target touched by the light: lit from within in gold and white. */
export const DIVINE_RADIANT_MATRIX = [
  1.5, 0.15, 0.05, 0, 0.16, 0.08, 1.4, 0.05, 0, 0.12, 0, 0.05, 1, 0, 0.06, 0, 0, 0, 1, 0,
];

/** The inks poured into the golden fluid, so it mixes white, gold and ember instead of being one color. */
export const DIVINE_FLUID_PALETTES = [
  ENERGY_PALETTES.holy,
  ENERGY_PALETTES.gold,
  ENERGY_PALETTES.ember,
];
