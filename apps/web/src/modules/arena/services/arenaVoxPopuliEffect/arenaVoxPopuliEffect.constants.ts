import { ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";

/** Length of the whole spell on the target, in milliseconds (the villain's spell takes its time). */
export const VOX_DURATION_MS = 4200;

/**
 * Phases of the spell (shares of the animation): the world darkens, the dark rumor pane appears, people
 * believe (their belief pours in through channels of energy; once the first one reaches it, its panes light up
 * one by one), it becomes true (the pane flashes and reality cracks), the pane
 * shatters on the target, and everything settles.
 */
export const VOX_PHASES = {
  dark: 0.06,
  pane: 0.18,
  believe: 0.2,
  connect: 0.36,
  truth: 0.66,
  shatter: 0.7,
  settle: 0.86,
} as const;

/**
 * How much bigger the one rumor window over a group of targets is, per token radius they spread, and at most.
 */
export const VOX_GROUP_GROWTH = 0.38;

export const VOX_GROUP_MAX = 2.2;

/**
 * Size of the rumor window, in token radii, and the gap it keeps above the highest target (it hangs over them,
 * not on them).
 */
export const VOX_PANE = { width: 3, height: 4.2, gap: 1.1 } as const;

/** Sectors the rumor's rays and ring are cut in. */
export const VOX_SECTORS = 12;

/**
 * Channels of red energy: belief pouring in from beyond the screen into the rumor window while it lights up, and
 * the verdict running down from it onto the targets.
 */
export const VOX_BELIEF_CHANNELS = 7;

export const VOX_VERDICT_CHANNELS = 3;

/** Shards per pane when the rumor shatters, plus loose glints. */
export const VOX_SHARDS_PER_CELL = 3;

export const VOX_GLINTS = 40;

/** Big shards flying at the viewer across the whole screen at the truth. */
export const VOX_SCREEN_SHARDS = 16;

export const VOX_SHOCKWAVE = { radii: 9, durationMs: 900, amplitude: 46, wavelength: 160 } as const;

/** Key of the screen part: an area spell plays it once. */
export const VOX_SCREEN_KEY = "vox-populi";

/** Glass colors of the rumor. */
export const VOX_GLASS = {
  rays: [0xb3122f, 0xe42a63, 0x6d0a22, 0xf07a9b, 0x8b0f2e, 0xc41652],
  crimson: 0x8b0f2e,
  ruby: 0xe42a63,
  gold: 0xd4a017,
  white: 0xfde4ea,
  pupil: 0x12010a,
} as const;

export const VOX_COLORS = {
  white: 0xffffff,
  blush: 0xffd1dc,
  rose: 0xf07a9b,
  ruby: 0xe42a63,
  blood: 0x9f0f2f,
  lead: 0x050203,
  darkGlass: 0x16060b,
  night: 0x020001,
} as const;

/** Identity color matrix (5×4). */
export const VOX_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** The world in blood-red monochrome: luminance into red, a little into green and blue. */
export const VOX_BLOOD_MATRIX = [
  0.42, 0.82, 0.16, 0, 0.02, 0.1, 0.2, 0.04, 0, 0, 0.12, 0.22, 0.05, 0, 0.01, 0, 0, 0, 1, 0,
];

/** The inks poured into the red fluid, so it mixes blood, scarlet and crimson instead of being one color. */
export const VOX_FLUID_PALETTES = [
  ENERGY_PALETTES.blood,
  ENERGY_PALETTES.scarlet,
  ENERGY_PALETTES.crimson,
];
