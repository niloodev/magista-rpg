import type { DropIndicatorProps } from "./DropIndicator.types";

export function DropIndicator({ position }: DropIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      data-drop-indicator={position}
      className={`pointer-events-none absolute right-0 left-0 z-20 h-0.5 bg-teal-400 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] before:absolute before:top-1/2 before:-left-1 before:h-2.5 before:w-2.5 before:-translate-y-1/2 before:rotate-45 before:border-2 before:border-teal-400 before:bg-void-900 ${position === "before" ? "-top-1" : "-bottom-1"}`}
    />
  );
}
