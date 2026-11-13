import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}
