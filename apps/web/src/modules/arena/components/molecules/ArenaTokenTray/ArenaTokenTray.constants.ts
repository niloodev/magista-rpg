export const ARENA_TRAY_CLASSES =
  "max-w-[calc(100vw-6rem)] border border-white/10 bg-black/60 p-0.5 backdrop-blur-sm lite:bg-void-900/95 lite:backdrop-blur-none";

export const ARENA_TRAY_LIST_CLASSES = "flex gap-1.5 overflow-x-auto p-1";

export const ARENA_TRAY_BUTTON_CLASSES =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-shadow duration-200";

export const ARENA_TRAY_SELECTED_CLASSES = "shadow-[0_0_0_2px_var(--magista-gold-400)]";

export const ARENA_TRAY_HOVER_CLASSES =
  "hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--magista-ruby-400)_60%,transparent)]";

export const ARENA_TRAY_TONE_CLASSES = { own: "", other: "!ring-teal-400/70" } as const;
