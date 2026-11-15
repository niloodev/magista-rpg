"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { RESIZE_KEY_STEP, RESIZE_KEY_STEP_LARGE } from "./ResizeHandle.constants";
import type { ResizeHandleProps } from "./ResizeHandle.types";
import { clampWidth } from "./ResizeHandle.utils";

/**
 * Drag (pointer capture) and keyboard (arrows, Shift for bigger steps, Home and End) resizing of a side panel.
 */
export function useResizeHandle({
  value,
  min,
  max,
  direction,
  onChange,
  onCommit,
}: Omit<ResizeHandleProps, "label" | "className">) {
  const drag = useRef<{ startX: number; startValue: number; last: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startValue: value, last: value };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const next = clampWidth(
      current.startValue + (event.clientX - current.startX) * direction,
      min,
      max,
    );
    if (next === current.last) return;
    current.last = next;
    onChange(next);
  };

  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (current) onCommit(current.last);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? RESIZE_KEY_STEP_LARGE : RESIZE_KEY_STEP;
    const targets: Record<string, number> = {
      ArrowRight: value + step * direction,
      ArrowLeft: value - step * direction,
      Home: min,
      End: max,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = clampWidth(target, min, max);
    onChange(next);
    onCommit(next);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onKeyDown };
}
