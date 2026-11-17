/** Lorcan's mouth beside Talis drinking the soul: how long it lasts and when the target starts to be drained. */
export const SOUL_SIPHON_DURATION_MS = 1700;

export const SOUL_SIPHON_HIT_MS = 260;

/**
 * Phases (shares of the animation): the mouth opens, the stream of soul reaches it, keeps flowing, its tail is
 * swallowed, and the mouth closes in a gulp that Talis absorbs.
 */
export const SOUL_SIPHON_PHASES = {
  open: 0.15,
  reach: 0.3,
  swallow: 0.72,
  gulp: 0.86,
} as const;

/** Fangs around the spectral mouth, souls riding the stream, points along it. */
export const SOUL_SIPHON_FANGS = 12;

export const SOUL_SIPHON_SOULS = 22;

export const SOUL_SIPHON_STEPS = 28;
