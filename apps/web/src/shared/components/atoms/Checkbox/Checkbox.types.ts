import type { InputHTMLAttributes } from "react";

export type CheckboxTone = "ruby" | "teal";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "checked"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tone?: CheckboxTone;
  label?: string;
}
