import type { ButtonHTMLAttributes } from "react";

export interface DragHandleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}
