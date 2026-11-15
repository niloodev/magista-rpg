export const BADGE_SIZES = {
  sm: { box: "px-1.5 py-0 text-xs leading-[14px]", icon: 12 },
  md: { box: "px-2 py-0.5 text-xs", icon: 12 },
} as const;

export const BADGE_BASE =
  "inline-flex items-center gap-1 border font-sans font-bold tracking-[0.14em] whitespace-nowrap uppercase";

export const MORE_TONE = "border-white/20 bg-black/40 text-muted-strong";

export const COMPACT_LABEL = "@max-md:sr-only";
