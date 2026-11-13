import { Text } from "@/shared/components/atoms";

import type { FormFieldProps } from "./FormField.types";

export function FormField({ id, label, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <Text variant="label" htmlFor={id} className="mb-[0.4rem]">
        {label}
      </Text>
      {children}
    </div>
  );
}
