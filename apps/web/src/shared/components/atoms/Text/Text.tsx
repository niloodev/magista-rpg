import { TEXT_ELEMENTS, TEXT_VARIANTS } from "./Text.constants";
import type { TextProps } from "./Text.types";

export function Text({ variant = "body", as, className, ...props }: TextProps) {
  const Element = as ?? TEXT_ELEMENTS[variant];
  return <Element className={`${TEXT_VARIANTS[variant]} ${className ?? ""}`} {...props} />;
}
