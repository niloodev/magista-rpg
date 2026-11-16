import { ARENA_CHANGE_TEXTS } from "@/modules/arena/arena.constants";

import type { IArenaSegment } from "./ArenaChangeMenu.types";

export const KIND_SEGMENTS: IArenaSegment<"damage" | "heal">[] = [
  { value: "damage", label: ARENA_CHANGE_TEXTS.damage, icon: "swords" },
  { value: "heal", label: ARENA_CHANGE_TEXTS.heal, icon: "sparkles" },
];

export const RESOURCE_SEGMENTS: IArenaSegment<"health" | "sanity">[] = [
  { value: "health", label: ARENA_CHANGE_TEXTS.health, icon: "heart" },
  { value: "sanity", label: ARENA_CHANGE_TEXTS.sanity, icon: "zap" },
];

/** Tones of the action: damage in ruby, healing in teal. */
export const KIND_TONES = {
  damage: {
    checked:
      "has-checked:border-primary has-checked:bg-gradient-to-br has-checked:from-ruby-900/80 has-checked:to-black/60 has-checked:text-accent-text has-checked:shadow-[0_0_16px_rgba(228,42,99,0.25)]",
    submit:
      "border-primary/70 bg-gradient-to-r from-ruby-600/80 via-ruby-900/80 to-ruby-600/80 text-white not-disabled:hover:shadow-[0_0_22px_rgba(228,42,99,0.45)]",
  },
  heal: {
    checked:
      "has-checked:border-teal-400 has-checked:bg-gradient-to-br has-checked:from-teal-900/80 has-checked:to-black/60 has-checked:text-teal-200 has-checked:shadow-[0_0_16px_rgba(45,212,191,0.22)]",
    submit:
      "border-teal-400/70 bg-gradient-to-r from-teal-600/70 via-teal-900/80 to-teal-600/70 text-white not-disabled:hover:shadow-[0_0_22px_rgba(45,212,191,0.4)]",
  },
} as const;

export const SEGMENT_CLASS =
  "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 border border-white/10 bg-black/40 px-3 font-sans text-[15px] font-semibold text-muted-strong transition-[border-color,background-color,box-shadow,color] duration-200 hover:border-white/25 hover:text-label has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-ruby-400";

export const SECTION_LABEL_CLASS =
  "font-sans text-xs font-semibold tracking-[0.14em] text-label uppercase";

export const ATTACKER_CHOICE_CLASS =
  "flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 px-1 py-1.5 transition-colors hover:bg-white/5 has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-ruby-400";

export const ATTACKER_RING_CLASS =
  "rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-void-900 transition-shadow group-has-checked/attacker:ring-gold-400";

export const STEP_BUTTON_CLASS =
  "flex size-10 items-center justify-center border border-white/10 bg-black/50 text-muted-strong transition-colors hover:border-gold-400/60 hover:text-label";
