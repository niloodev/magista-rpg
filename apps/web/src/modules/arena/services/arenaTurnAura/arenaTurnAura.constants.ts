/** Fade of the aura when the turn arrives or leaves, in ms. */
export const TURN_AURA_FADE_MS = 450;

/** After the turn moves on, the fluid keeps drifting outward and fades on its own this long, in ms. */
export const TURN_FLUID_LINGER_MS = 900;

/** One full bob of the floating token, in ms. */
export const TURN_BOB_PERIOD_MS = 2600;

/**
 * Hover height of the token (share of its size) and how far it bobs around it, never more than `max` map pixels
 * (big tokens float as little as the usual ones).
 */
export const TURN_LIFT = { hover: 0.05, bob: 0.018, max: 12, bobMax: 4 } as const;

/** The ring on the ground: radius around a round token, squash of the ellipse at a figure's feet. */
export const TURN_RING = {
  portraitRadius: 0.62,
  figureRadius: 0.8,
  figureSquash: 0.36,
  /** The sharp ring that gives the aura its shape, and the wider one that only pours ink (shares of the token). */
  width: 0.09,
  inkWidth: 0.16,
  samples: 64,
  speed: 120,
  sharpness: 3,
  strands: 4,
  alpha: 0.85,
  inkAlpha: 0.55,
} as const;

/**
 * The red fluid the ring pours into: it hugs the ring and turns with it, fading fast so it never spreads (shares
 * of the ring radius).
 */
export const TURN_FLUID = {
  side: 1.9,
  resolution: 256,
  simulation: 80,
  pressureSteps: 8,
  decay: 0.3,
  turbulence: { scale: 1.2, force: 2.2 },
  vorticity: 26,
  gain: 1,
  inject: 1.6,
  outward: 0.12,
  swirl: 1.6,
} as const;

/** The soft glow behind the body (share of the token). */
export const TURN_GLOW = {
  body: 1.45,
  bodyAlpha: 0.16,
  breath: 0.06,
  color: 0xe42a63,
} as const;

/** Still ring of the light mode (no shader, no motion). */
export const TURN_LITE_RING = { width: 0.035, alpha: 0.75, color: 0xe42a63 } as const;
