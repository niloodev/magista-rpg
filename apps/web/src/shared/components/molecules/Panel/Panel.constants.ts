import type { PanelVariant } from "./Panel.types";

export const PANEL_VARIANTS: Record<PanelVariant, string> = {
  glass:
    "bg-black/40 border border-white/5 backdrop-blur-sm hover:border-primary/30 [clip-path:var(--magista-clip-panel)] shadow-[var(--magista-glow-panel)]",
  primary:
    "bg-black/60 border border-primary/30 border-l-4 border-l-primary hover:border-primary/50",
  inner: "bg-black/40 backdrop-blur-sm border border-border/30 hover:border-primary/30",
};
