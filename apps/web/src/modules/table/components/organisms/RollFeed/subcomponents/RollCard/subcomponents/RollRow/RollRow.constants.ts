import { NATURAL_LABELS } from "@/modules/table/table.constants";
import type { NaturalOutcome } from "@/modules/table/table.types";

export const NATURAL_STYLES: Record<
  Exclude<NaturalOutcome, null>,
  { label: string; chip: string; text: string }
> = {
  critical: {
    label: NATURAL_LABELS.critical,
    chip: "border-gold-300 bg-gold-500/30 text-gold-200",
    text: "text-gold-300",
  },
  fumble: {
    label: NATURAL_LABELS.fumble,
    chip: "border-accent-text bg-primary/30 text-white",
    text: "text-accent-text",
  },
};

export const TOTAL_STYLES = {
  critical:
    "h-14 w-12 bg-[linear-gradient(135deg,#b45309,#fbbf24_45%,#fde68a_60%,#d97706)] text-2xl font-bold text-void-900",
  primary: "h-14 w-12 bg-primary/80 text-2xl text-white",
  secondary: "h-12 w-11 bg-teal-700/80 text-xl text-white",
} as const;
