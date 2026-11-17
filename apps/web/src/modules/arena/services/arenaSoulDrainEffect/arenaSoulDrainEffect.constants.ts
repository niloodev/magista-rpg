/** Length of the drain on the target, in milliseconds. */
export const SOUL_DRAIN_DURATION_MS = 1600;

/** Wisps of soul pulled out of the target toward the attacker, and the cold motes left around it. */
export const SOUL_DRAIN_WISPS = 34;

export const SOUL_DRAIN_MOTES = 16;

/** Colors of death and Nox: black and purple, with the pale light of a soul. */
export const NOX_COLORS = {
  black: 0x000000,
  void: 0x0b0614,
  shadow: 0x1a0b2e,
  deep: 0x2e1065,
  purple: 0x6d28d9,
  violet: 0x8b5cf6,
  lavender: 0xc4b5fd,
  pale: 0xede9fe,
  soul: 0xe9d5ff,
  white: 0xffffff,
} as const;

/** Identity color matrix (5×4). */
export const NOX_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** A drained body: colors gone gray and cold violet, darker. */
export const NOX_DRAINED_MATRIX = [
  0.3, 0.35, 0.1, 0, 0.02, 0.22, 0.28, 0.1, 0, 0, 0.32, 0.32, 0.3, 0, 0.04, 0, 0, 0, 1, 0,
];
