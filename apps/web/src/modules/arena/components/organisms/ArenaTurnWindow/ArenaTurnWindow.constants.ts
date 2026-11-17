export const TURN_ICON_BUTTON =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-white/10 bg-black/50 text-muted-strong transition-colors duration-200 not-disabled:hover:border-primary/40 not-disabled:hover:text-accent-text disabled:opacity-40";

export const TURN_HEADER_CLASSES =
  "sticky top-0 z-10 space-y-3 border-b border-primary/20 bg-gradient-to-b from-void-800 to-void-900 px-3 pt-3 pb-3";

export const TURN_ROUND_HEX_CLASSES =
  "relative flex h-12 w-11 shrink-0 items-center justify-center font-serif text-xl text-gold-200 tabular-nums";

/** The turn order window keeps its place under the sheet windows: pressing it does not raise it. */
export const NO_ACTIVATION = () => {};
