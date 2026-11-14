import type { InputHTMLAttributes, Ref } from "react";

export type InputSize = "default" | "micro" | "bare";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}
