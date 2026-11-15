import type { StepperTone } from "./Stepper.types";

export const STEPPER_BUTTON_TONES: Record<StepperTone, string> = {
  ruby: "text-accent-text border-primary/30 not-disabled:hover:text-white not-disabled:hover:bg-primary/25 not-disabled:hover:border-primary/70",
  teal: "text-teal-400 border-teal-700/50 not-disabled:hover:text-white not-disabled:hover:bg-teal-900/60 not-disabled:hover:border-teal-400",
};

export const STEPPER_SIZES = {
  sm: { button: "h-8 w-8", icon: 14, field: "h-8 w-12 text-base" },
  lg: {
    button: "h-10 w-10 rounded-full",
    icon: 18,
    field: "h-12 w-16 font-serif text-4xl font-light",
  },
} as const;
