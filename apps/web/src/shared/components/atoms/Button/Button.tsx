import { BUTTON_SHAPES, BUTTON_SIZES, BUTTON_VARIANTS } from "./Button.constants";
import type { ButtonProps } from "./Button.types";

export function Button({
  variant = "primary",
  size = "md",
  shape = "cut",
  block = false,
  loading = false,
  loadingLabel,
  icon,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass = shape === "slant" ? "" : BUTTON_VARIANTS[variant];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`magista-btn inline-flex cursor-pointer items-center justify-center font-serif uppercase disabled:cursor-default disabled:opacity-70 ${BUTTON_SHAPES[shape]} ${BUTTON_SIZES[size]} ${variantClass} ${block ? "w-full" : ""} ${className ?? ""}`}
      {...props}
    >
      {icon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
