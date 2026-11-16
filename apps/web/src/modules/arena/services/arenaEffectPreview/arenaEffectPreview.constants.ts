/** Diameter of the sample tokens, in pixels. */
export const PREVIEW_TOKEN_SIZE = 64;

/** Pause between two plays of the loop. */
export const PREVIEW_PAUSE_MS = 650;

/** Where the attacker and the target stand, as shares of the canvas width. */
export const PREVIEW_ATTACKER_X = 0.24;

export const PREVIEW_TARGET_X = 0.72;

export const PREVIEW_COLORS = {
  ground: 0x0b0307,
  grid: 0x2a0a18,
  base: 0x1a0610,
  ruby: 0xe42a63,
  teal: 0x2dd4bf,
  initial: 0xf07a9b,
} as const;

export const PREVIEW_SAMPLE_AMOUNT = 5;
