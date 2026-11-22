/** Runes of the turning ring, as SVG paths in a box 18 units tall centered on the origin. */
export const LOADING_RUNES = [
  "M0 -9V9M0 -9L6 -3M0 -3L6 3",
  "M-4 -9V9M-4 -9L4 -1L-4 7",
  "M0 -9V9M-5 -4L5 4",
  "M0 -9V9M0 -2L-5 -8M0 -2L5 -8",
  "M-5 -9L5 9M5 -9L-5 9",
  "M0 -9L5 0L0 9L-5 0Z",
  "M-5 9L0 -9L5 9M-2.5 2H2.5",
  "M0 -9V9M-5 -9L5 -3M-5 3L5 9",
  "M-4 -9V9M4 -9V9M-4 -9L4 0",
  "M-5 -9V9M5 -9V9M-5 -9L5 9",
] as const;

/** Radius of the ring of runes in the seal (viewBox -100 to 100). */
export const LOADING_RUNE_RADIUS = 72;

/** The Othala rune (ᛟ) at the heart of the seal. */
export const LOADING_OTHALA = "M0 -46.5L31 -15.5L-31 46.5M0 -46.5L-31 -15.5L31 46.5";

/** Circumference of the progress ring (radius 90), for its dash. */
export const LOADING_RING_LENGTH = 2 * Math.PI * 90;

export const LOADING_SPIN_CLASS =
  "origin-center [transform-box:fill-box] animate-marked-spin-fast motion-reduce:animate-none lite:animate-none";

export const LOADING_BREATHE_CLASS =
  "origin-center [transform-box:fill-box] animate-marked-breathe motion-reduce:animate-none lite:animate-none";
