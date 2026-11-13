import type { InputHTMLAttributes } from "react";

export type InputSize = "default" | "micro";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  invalid?: boolean;
}
