import { Text } from "@/shared/components/atoms";

import type { FormFieldProps } from "./FormField.types";

export function FormField({
  id,
  label,
  children,
  className,
  variant = "sheet",
  error,
  hint,
}: FormFieldProps) {
  return (
    <div className={className}>
      <Text variant={variant === "login" ? "label" : "fieldLabel"} htmlFor={id} className="mb-1.5">
        {label}
      </Text>
      {children}
      {hint && !error && <p className="mt-1.5 font-sans text-[13px] text-muted-strong">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 font-sans text-[13px] font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
