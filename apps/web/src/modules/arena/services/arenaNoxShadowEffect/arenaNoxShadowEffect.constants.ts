/** Talis calls the shadows: how long it lasts and when his shadow reaches the target. */
export const NOX_SHADOW_DURATION_MS = 1500;

export const NOX_SHADOW_HIT_MS = 1000;

/** Tendrils of shadow writhing around Talis. */
export const NOX_SHADOW_TENDRILS = 6;

/** Points along his shadow on the ground, and along each tendril. */
export const NOX_SHADOW_PATH_POINTS = 24;

export const NOX_SHADOW_TENDRIL_POINTS = 12;

/** How far the living shadow reaches around him and the target, in token radii (to the sides, up, down). */
export const NOX_SHADOW_FIELD = { side: 4, above: 5, below: 3 } as const;
