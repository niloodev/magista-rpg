/** How far a butterfly flutters off its path, in wingspans, and how fast (cycles per second). */
export const BUTTERFLY_FLUTTER = { reach: 0.32, rate: 2.6 } as const;

/** Narrowest the wings close on a beat, as a share of the open wingspan. */
export const BUTTERFLY_CLOSED = 0.16;

/** Its body length, as a share of the wingspan (the height of the sprite). */
export const BUTTERFLY_BODY = 0.82;

/**
 * Below this speed (wingspans per second) a butterfly no longer faces where it goes and turns its head up, as one
 * hovering does.
 */
export const BUTTERFLY_HOVER_SPEED = 1.6;

/** Time step to read where a butterfly is heading, in seconds. */
export const BUTTERFLY_HEADING_STEP = 0.03;

/** How far a butterfly rocks side to side as it flutters, in radians. */
export const BUTTERFLY_WOBBLE = 0.22;
