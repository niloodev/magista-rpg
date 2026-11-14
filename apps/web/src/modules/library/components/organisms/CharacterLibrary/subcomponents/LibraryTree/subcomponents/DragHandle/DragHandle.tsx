import { Icon } from "@/shared/components/atoms";

import type { DragHandleProps } from "./DragHandle.types";

export function DragHandle({ label, ...props }: DragHandleProps) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      className="flex h-9 w-8 cursor-grab touch-none items-center justify-center bg-black/40 text-muted-strong transition-colors duration-200 hover:text-foreground active:cursor-grabbing"
    >
      <Icon name="grip-vertical" size={18} aria-hidden="true" />
    </button>
  );
}
