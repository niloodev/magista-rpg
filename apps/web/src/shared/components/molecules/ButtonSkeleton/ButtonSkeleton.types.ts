import type { ButtonSize, ButtonVariant, IconName } from "@/shared/components/atoms";

export interface ButtonSkeletonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconSize?: number;
  disabled?: boolean;
  className?: string;
}
