import type { CursorLightProps } from "./CursorLight.types";

export function CursorLight({ ref }: CursorLightProps) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[2] transition-[background] duration-150 ease-out"
    />
  );
}
