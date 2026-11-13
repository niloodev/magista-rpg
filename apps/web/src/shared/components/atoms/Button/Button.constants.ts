import type { ButtonShape, ButtonSize, ButtonVariant } from "./Button.types";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary/85 text-primary-foreground border border-ruby-500/40 shadow-[0_0_22px_rgba(220,25,88,0.2)] hover:bg-primary/92 hover:shadow-[0_0_36px_rgba(236,42,102,0.46)] active:scale-[0.97] active:translate-y-[2px]",
  secondary:
    "bg-black/40 text-foreground border border-primary/40 hover:border-primary/80 hover:bg-primary/15 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(228,42,99,0.25)] active:scale-95",
  mystic:
    "bg-teal-900/40 text-teal-400 border border-teal-500/40 hover:border-teal-500/80 hover:bg-teal-900/60 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(20,184,166,0.25)] active:scale-95",
  destructive:
    "bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive/35 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(212,24,61,0.3)] active:scale-95",
  ghost: "bg-transparent text-muted-foreground hover:text-primary hover:bg-white/5",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-[10px] gap-1.5 [--cut:8px]",
  md: "h-11 px-6 text-xs gap-2 [--cut:12px]",
  lg: "h-14 px-8 text-sm gap-2.5 [--cut:16px]",
};

export const BUTTON_SHAPES: Record<ButtonShape, string> = {
  cut: "magista-btn-cut tracking-[0.15em]",
  slant: "magista-btn-slant",
};
