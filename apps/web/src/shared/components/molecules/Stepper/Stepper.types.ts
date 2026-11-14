export type StepperTone = "ruby" | "teal";

export interface StepperProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  tone?: StepperTone;
  label: string;
  size?: "sm" | "lg";
}
