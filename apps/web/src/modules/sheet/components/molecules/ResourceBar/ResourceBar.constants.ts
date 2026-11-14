import type { IconName } from "@/shared/components/atoms";

import type { ResourceTone } from "./ResourceBar.types";

export const RESOURCE_TONES: Record<
  ResourceTone,
  { icon: IconName; label: string; track: string; fill: string; input: string }
> = {
  health: {
    icon: "heart",
    label: "text-accent-text",
    track: "border-primary/30 group-hover:border-primary/60",
    fill: "bg-primary",
    input: "border-primary/40",
  },
  sanity: {
    icon: "zap",
    label: "text-teal-300",
    track: "border-teal-900/40 group-hover:border-teal-500/60",
    fill: "bg-teal-600",
    input: "border-teal-900/50 text-teal-200",
  },
};
