export const TURN_ROW_CLASSES = {
  base: "group/turn relative flex min-h-13 min-w-0 flex-1 items-center gap-2.5 border py-1 pr-1 pl-1.5 transition-[border-color,background-color,box-shadow] duration-300",
  current:
    "border-gold-400/55 bg-gradient-to-r from-gold-700/30 via-gold-700/10 to-transparent shadow-[inset_3px_0_0_var(--magista-gold-400),0_0_22px_rgba(251,191,36,0.12)] lite:shadow-[inset_3px_0_0_var(--magista-gold-400)]",
  idle: "border-white/5 bg-black/35 hover:border-primary/30",
} as const;

export const TURN_ROW_TONE_CLASSES = { own: "", other: "!ring-teal-400/70" } as const;

export const TURN_ROW_TAG_CLASSES = {
  current: "text-gold-300",
  upNext: "text-muted-strong",
} as const;
