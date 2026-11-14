export type RollBarTone = "ruby" | "teal";

export interface RollBarProps {
  label: string;
  expression: string;
  tone?: RollBarTone;
  onRoll: () => void;
}
