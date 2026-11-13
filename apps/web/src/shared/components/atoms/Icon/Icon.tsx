import { ICONS } from "./Icon.constants";
import type { IconProps } from "./Icon.types";

export function Icon({ name, size = 16, ...props }: IconProps) {
  const Glyph = ICONS[name];
  return <Glyph size={size} aria-hidden="true" {...props} />;
}
