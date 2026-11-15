export const TAB_REGULAR = "sm:flex-none sm:gap-2 sm:px-4 sm:text-sm sm:tracking-wider";

export const TAB_DENSE = "sm:gap-1.5 sm:px-1 sm:tracking-wide";

/** Base classes of a tab: stacked icon over label when narrow, a row with the label in caps when wide. */
export const TAB_BASE = {
  viewport: "min-h-14 flex-col sm:min-h-12 sm:flex-row sm:uppercase",
  container: "min-h-14 flex-col @min-[37rem]:min-h-12 @min-[37rem]:flex-row @min-[37rem]:uppercase",
} as const;

/** `TAB_REGULAR` measured by the nearest container instead of the screen (sheets inside panels). */
export const TAB_REGULAR_CONTAINER =
  "@min-[37rem]:flex-none @min-[37rem]:gap-2 @min-[37rem]:px-4 @min-[37rem]:text-sm @min-[37rem]:tracking-wider";
