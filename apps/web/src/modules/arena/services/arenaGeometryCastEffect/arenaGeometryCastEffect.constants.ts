/** Length of the caster's part, in milliseconds. */
export const GEOMETRY_CAST_DURATION_MS = 1500;

/** The figures build up until here (share of the animation), then the stream of symbols is released. */
export const GEOMETRY_RELEASE = 0.4;

/** How long the stream takes to reach the target, in milliseconds. */
export const GEOMETRY_TRAVEL_MS = 320;

/** When the stream reaches the target (its collapse starts here). */
export const GEOMETRY_HIT_MS = Math.round(
  GEOMETRY_CAST_DURATION_MS * GEOMETRY_RELEASE + GEOMETRY_TRAVEL_MS,
);

/** Symbols orbiting the caster while the figures build up. */
export const GEOMETRY_ORBIT_GLYPHS = 32;

/** Symbols left along the two strands of the helix the stream draws. */
export const GEOMETRY_STRAND_GLYPHS = 64;

/** Symbols riding the whole way with the head of the stream. */
export const GEOMETRY_RIDERS = 12;

/** Share of the symbol particles that are digits and arithmetic signs rather than math symbols. */
export const GEOMETRY_DIGIT_SHARE = 0.65;

/** Digits rising around the caster while the figures build up. */
export const GEOMETRY_DIGIT_RAIN = 28;

export const GEOMETRY_COLORS = {
  white: 0xffffff,
  core: 0xe0f2ff,
  ice: 0x9fd8ff,
  cyan: 0x22d3ee,
  blue: 0x3b82f6,
  indigo: 0x4f46e5,
  deep: 0x1e1b4b,
} as const;

/** Colors of a math symbol from birth to fade (the caster's and the target's): white, ice, cyan, blue, indigo. */
export const GEOMETRY_GLYPH_STOPS = [
  GEOMETRY_COLORS.white,
  GEOMETRY_COLORS.ice,
  GEOMETRY_COLORS.cyan,
  GEOMETRY_COLORS.blue,
  GEOMETRY_COLORS.indigo,
] as const;
