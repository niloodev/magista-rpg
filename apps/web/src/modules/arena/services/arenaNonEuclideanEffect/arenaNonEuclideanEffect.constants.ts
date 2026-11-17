/** Length of the collapse, in milliseconds. */
export const NON_EUCLIDEAN_DURATION_MS = 1700;

/** Everything has fallen into the point here (share of the animation); then it bursts out. */
export const NON_EUCLIDEAN_COLLAPSE = 0.62;

/** Sides of the nested polygons of the lattice, outside in. */
export const NON_EUCLIDEAN_LAYERS = [8, 7, 6, 5, 4, 3] as const;

/** Symbols spiraling into the point. */
export const NON_EUCLIDEAN_SPIRAL_GLYPHS = 48;

/** Share of the symbol particles that are digits and arithmetic signs rather than math symbols. */
export const NON_EUCLIDEAN_DIGIT_SHARE = 0.65;

/** Digits turning on an outer ring that tightens into the point with the lattice. */
export const NON_EUCLIDEAN_DIGIT_RING = 24;

/** Symbols and sparks thrown out by the burst. */
export const NON_EUCLIDEAN_BURST_GLYPHS = 34;

export const NON_EUCLIDEAN_BURST_SPARKS = 26;

export const NON_EUCLIDEAN_SHOCKWAVE = {
  radii: 4.2,
  durationMs: 680,
  amplitude: 28,
  wavelength: 110,
} as const;

export const NON_EUCLIDEAN_COLORS = {
  white: 0xffffff,
  core: 0xe0f2ff,
  ice: 0x9fd8ff,
  cyan: 0x22d3ee,
  blue: 0x3b82f6,
  indigo: 0x4f46e5,
  deep: 0x1e1b4b,
  void: 0x05031a,
} as const;
