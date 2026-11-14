"use client";

import { Input } from "@/shared/components/atoms";

import { useNumberField } from "./NumberField.hook";
import type { NumberFieldProps } from "./NumberField.types";

export function NumberField({
  value,
  onValueChange,
  min,
  max,
  allowEmpty,
  compact = false,
  className,
  ...props
}: NumberFieldProps) {
  const { text, onChange, onBlur } = useNumberField({ value, onValueChange, min, max, allowEmpty });
  return (
    <Input
      inputMode="numeric"
      value={text}
      onChange={onChange}
      onBlur={onBlur}
      inputSize={compact ? "bare" : "default"}
      className={`text-center ${className ?? ""}`}
      {...props}
    />
  );
}
