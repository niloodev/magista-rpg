"use client";

import { useResizeHandle } from "./ResizeHandle.hook";
import type { ResizeHandleProps } from "./ResizeHandle.types";

/**
 * Vertical edge that resizes a side panel: drag it, or focus it and use the arrows (Home and End jump to the
 * limits). A thin ruby line shows on hover, focus and while dragging.
 */
export function ResizeHandle({ label, value, min, max, className, ...rest }: ResizeHandleProps) {
  const { onPointerDown, onPointerMove, onPointerUp, onKeyDown } = useResizeHandle({
    value,
    min,
    max,
    ...rest,
  });
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`group absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none focus-visible:outline-none ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors duration-150 group-hover:bg-primary/70 group-focus-visible:w-0.5 group-focus-visible:bg-ruby-400 group-active:bg-primary"
      />
    </div>
  );
}
