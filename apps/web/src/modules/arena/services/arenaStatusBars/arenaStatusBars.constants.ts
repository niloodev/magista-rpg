export const STATUS_BAR_COLORS = {
  track: 0x060203,
  border: 0x000000,
  health: 0xda2054,
  healthChip: 0xf07a9b,
  sanity: 0x0d9488,
  sanityChip: 0x2dd4bf,
  value: 0xf6e7ec,
  stroke: 0x000000,
} as const;

/** Thickness of a bar on screen, in CSS pixels (it grows with the token, inside these limits). */
export const STATUS_BAR_MIN_PX = 6;

export const STATUS_BAR_MAX_PX = 10;

/** Thickness on screen while the values are shown (hover or selection), to fit the 12px text inside. */
export const STATUS_BAR_EXPANDED_PX = 18;

export const STATUS_BAR_VALUE_PX = 12;

/** Gap between the bars, on screen. */
export const STATUS_BAR_GAP_PX = 3;

/** Gap between the lowest bar and the token, on screen. */
export const STATUS_BAR_LIFT_PX = 10;

/** Smallest bar width on screen, so a far away token still shows a readable bar. */
export const STATUS_BAR_MIN_WIDTH_PX = 40;

/** Share of the token diameter taken by the bar width. */
export const STATUS_BAR_WIDTH_RATIO = 0.9;

/** The fill reaches the new value in this time; the lighter trail waits, then catches up. */
export const STATUS_FILL_MS = 420;

export const STATUS_CHIP_DELAY_MS = 320;

export const STATUS_CHIP_MS = 520;

export const STATUS_FLOAT_MS = 900;

/** How far a floating change rises on screen. */
export const STATUS_FLOAT_RISE_PX = 22;

export const STATUS_FLOAT_FONT_PX = 14;

/** Most floating changes alive per bar set (an older one leaves when a new one comes). */
export const STATUS_FLOAT_MAX = 3;
