import type { InputProps } from "@/shared/components/atoms";

export interface NumberFieldProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  compact?: boolean;
}

export type NumberFieldHookProps = Pick<
  NumberFieldProps,
  "value" | "onValueChange" | "min" | "max" | "allowEmpty"
>;
