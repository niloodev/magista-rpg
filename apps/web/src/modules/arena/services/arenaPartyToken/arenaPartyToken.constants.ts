/**
 * The Othala rune (ᛟ) in a box one unit tall centered on the origin: the diamond on top and the two crossing legs,
 * as two strokes (taken from the sigil of the Marca).
 */
export const OTHALA_STROKES = [
  [
    { x: 0, y: -0.5 },
    { x: 0.333, y: -0.167 },
    { x: -0.333, y: 0.5 },
  ],
  [
    { x: 0, y: -0.5 },
    { x: -0.333, y: -0.167 },
    { x: 0.333, y: 0.5 },
  ],
] as const;

/** The runes around the Othala, as SVG paths in a box 18 units tall centered on the origin (as the Marca's). */
export const PARTY_RING_RUNES = [
  "M0 -9V9M0 -9L6 -3M0 -3L6 3",
  "M-4 -9V9M-4 -9L4 -1L-4 7",
  "M0 -9V9M-5 -4L5 4",
  "M0 -9V9M0 -2L-5 -8M0 -2L5 -8",
  "M-5 -9L5 9M5 -9L-5 9",
  "M0 -9L5 0L0 9L-5 0Z",
  "M-5 9L0 -9L5 9M-2.5 2H2.5",
  "M0 -9V9M-5 -9L5 -3M-5 3L5 9",
] as const;

/** Height of the box the ring runes are drawn in. */
export const PARTY_RUNE_BOX = 18;

/** How long the token holds each color and how long it blends into the next (ms). */
export const PARTY_COLOR_HOLD_MS = 1600;

export const PARTY_COLOR_BLEND_MS = 650;

/** The light mode steps the color without blending, less often. */
export const PARTY_LITE_STEP_MS = 2000;

/** Proportions of the token, in shares of its size (the radius is 0.5). */
export const PARTY_SHAPE = {
  disc: 0.5,
  frame: 0.47,
  frameWidth: 0.035,
  runeRing: 0.355,
  runeSize: 0.13,
  runeWidth: 0.022,
  innerRing: 0.25,
  innerWidth: 0.018,
  othala: 0.34,
  underlay: 0.075,
  energy: 0.05,
  glow: 2.3,
  selected: 0.6,
} as const;

/** The dark heart of the token and its thin gold frame (the colors that do not cycle). */
export const PARTY_COLORS = { disc: 0x090c16, frame: 0xe7c77a, selected: 0xfbbf24 } as const;

export const PARTY_ENERGY = { speed: 70, sharpness: 4, strands: 3, samples: 32 } as const;

export const PARTY_GLOW = { alpha: 0.45, breath: 0.12, periodMs: 2600 } as const;

/** How fast the ring of runes turns (radians per second). */
export const PARTY_RING_SPIN = 0.18;
