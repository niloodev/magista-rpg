import type { RollBarTone } from "./RollBar.types";

export const ROLL_BAR_TONES: Record<
  RollBarTone,
  { box: string; bar: string; label: string; value: string }
> = {
  ruby: {
    box: "border-primary/35 hover:border-primary/70 hover:shadow-[0_0_15px_rgba(228,42,99,0.18)]",
    bar: "bg-primary/60 group-hover:bg-primary",
    label: "text-accent-text",
    value: "text-foreground",
  },
  teal: {
    box: "border-teal-500/35 hover:border-teal-400/70 hover:shadow-[0_0_15px_rgba(20,184,166,0.18)]",
    bar: "bg-teal-500/60 group-hover:bg-teal-400",
    label: "text-teal-300",
    value: "text-teal-50",
  },
};
