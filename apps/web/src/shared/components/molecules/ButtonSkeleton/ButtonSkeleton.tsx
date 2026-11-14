import { BUTTON_SHAPES, BUTTON_SIZES, BUTTON_VARIANTS, Icon } from "@/shared/components/atoms";

import type { ButtonSkeletonProps } from "./ButtonSkeleton.types";

/**
 * Inert copy of a `Button` for skeletons: same variant, size, cut, icon and (fixed) label, but not focusable,
 * not clickable and hidden from assistive tech. Fixed labels stay real, as the skeleton rule asks.
 */
export function ButtonSkeleton({
  label,
  variant = "secondary",
  size = "md",
  icon,
  iconSize = 14,
  disabled = false,
  className,
}: ButtonSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`magista-btn pointer-events-none inline-flex shrink-0 items-center justify-center font-serif uppercase select-none ${BUTTON_SHAPES.cut} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${disabled ? "opacity-70" : ""} ${className ?? ""}`}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {label}
    </span>
  );
}
