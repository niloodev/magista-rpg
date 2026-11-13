import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "mystic" | "destructive" | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonShape = "cut" | "slant";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  block?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
  icon?: ReactNode;
}
