import type { CheckboxTone } from "./Checkbox.types";

export const CHECKBOX_TONES: Record<CheckboxTone, string> = {
  ruby: "border-primary/60 peer-checked:bg-primary peer-checked:border-primary group-hover:border-accent-text",
  teal: "border-teal-500/60 peer-checked:bg-teal-600 peer-checked:border-teal-500 group-hover:border-teal-400",
};
