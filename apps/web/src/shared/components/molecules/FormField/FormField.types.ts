import type { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  variant?: "login" | "sheet";
  error?: string;
  hint?: string;
}
