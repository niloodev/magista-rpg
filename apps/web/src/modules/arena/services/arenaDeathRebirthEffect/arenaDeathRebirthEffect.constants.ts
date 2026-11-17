/** Length of the whole spell on the target, in milliseconds (an ultimate takes its time). */
export const DEATH_DURATION_MS = 4800;

/**
 * Phases of the spell (shares of the animation): night falls in violet, a waning moon rises above the target,
 * shadows climb out of the ground and coil around it over a seal of Nox, its soul cracks white (the Eye of the
 * End), the spectral shovel of Death is raised and slams it, and it is reborn in a pillar of Nox fire while the
 * released souls rise.
 */
export const DEATH_PHASES = {
  dusk: 0.08,
  moon: 0.06,
  shadows: 0.16,
  seal: 0.22,
  cracks: 0.38,
  raise: 0.5,
  reap: 0.6,
  hit: 0.64,
  rebirth: 0.67,
  settle: 0.84,
} as const;

/** Shadows coiling around the target, souls rising after the rebirth, sparks of the slam, flames of the pillar. */
export const DEATH_SHADOWS = 8;

/** Most shadows over a group (three per target, at least the usual). */
export const DEATH_SHADOWS_MAX = 18;

/**
 * How much bigger the moon, the seal, the shovel and the pillar grow over a group of targets, per token radius
 * they spread, and at most.
 */
export const DEATH_GROUP_GROWTH = 0.5;

export const DEATH_GROUP_MAX = 3;

export const DEATH_SOULS = 40;

export const DEATH_SLAM_SPARKS = 28;

export const DEATH_FLAMES = 46;

/** Threads of violet energy rising from the target along the pillar at the rebirth. */
export const DEATH_RISING = 4;

/** Points along each shadow, rings of energy racing out at the slam, and rings climbing the pillar. */
export const DEATH_COIL_POINTS = 40;

export const DEATH_SLAM_RINGS = 3;

export const DEATH_PILLAR_RINGS = 4;

/** Cracks of the soul on the target. */
export const DEATH_CRACKS = 7;

/** The seal of Nox and the shadows lie on the ground around the target, seen at an angle. */
export const DEATH_FLOOR_TILT = 0.5;

/**
 * The spectral shovel, in token radii from where it is held (up and to the left of the target): where its blade
 * starts and ends (its middle lands on the target), and its angle raised and when it slams the target.
 */
export const DEATH_SPADE = {
  neck: 2.25,
  tip: 3.55,
  raised: -1.45,
  slam: Math.atan2(2.4, 1.6),
  hold: { x: -1.6, y: -2.4 },
} as const;

/** Height of the waning moon above the target, in token radii. */
export const DEATH_MOON_LIFT = 3.6;

export const DEATH_SHOCKWAVE = {
  radii: 9,
  durationMs: 1000,
  amplitude: 50,
  wavelength: 200,
} as const;

/** Key of the screen part: an area spell plays it once. */
export const DEATH_SCREEN_KEY = "death-rebirth";

/** The world in a violet night: dark, cold and purple. */
export const DEATH_NIGHT_MATRIX = [
  0.32, 0.18, 0.14, 0, 0.03, 0.08, 0.16, 0.1, 0, 0, 0.3, 0.2, 0.42, 0, 0.06, 0, 0, 0, 1, 0,
];

/** The target reborn: lit from within in violet and white. */
export const DEATH_REBORN_MATRIX = [
  1.25, 0.1, 0.25, 0, 0.12, 0.05, 1.05, 0.2, 0, 0.04, 0.2, 0.15, 1.5, 0, 0.18, 0, 0, 0, 1, 0,
];
