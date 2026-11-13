import { INPUT_SIZES } from "./Input.constants";
import type { InputProps } from "./Input.types";

export function Input({ inputSize = "default", invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`magista-input font-sans ${INPUT_SIZES[inputSize]} ${className ?? ""}`}
      {...props}
    />
  );
}
