"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from "react";

import { WINDOW_KEY_STEP, WINDOW_MIN_SIZE } from "./FloatingWindow.constants";
import type { FloatingWindowProps, IWindowRect } from "./FloatingWindow.types";
import { clampWindowRect, gestureRect, keyGesture } from "./FloatingWindow.utils";

interface IGesture {
  mode: "move" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  rect: IWindowRect;
  last: IWindowRect;
}

/**
 * Drag (title bar), resize (corner) and keyboard moves of a floating window. The rect is owned by the parent:
 * every step is reported clamped to the viewport, and the release is reported as a commit (to persist it).
 * The window takes the focus when it opens and gives it back to what had it when it closes.
 */
export function useFloatingWindow({
  rect,
  onRectChange,
  minSize = WINDOW_MIN_SIZE,
  minTop = 0,
  onDragPoint,
}: Pick<FloatingWindowProps, "rect" | "onRectChange" | "minSize" | "minTop" | "onDragPoint">) {
  const titleId = useId();
  const hintId = useId();
  const gesture = useRef<IGesture | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    frame?.focus({ preventScroll: true });
    return () => {
      const focusLeft = !document.activeElement || document.activeElement === document.body;
      if ((focusLeft || frame?.contains(document.activeElement)) && previous?.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  const begin = (mode: IGesture["mode"], event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (mode === "move" && (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      last: rect,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const next = clampWindowRect(
      gestureRect(
        current.rect,
        current.mode,
        event.clientX - current.startX,
        event.clientY - current.startY,
      ),
      viewport(),
      minSize,
      minTop,
    );
    current.last = next;
    onRectChange(next, false);
    if (current.mode === "move") onDragPoint?.({ x: event.clientX, y: event.clientY }, false);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    onRectChange(current.last, true);
    if (current.mode === "move") onDragPoint?.({ x: event.clientX, y: event.clientY }, true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!event.altKey) return;
    const step = keyGesture(event.key, event.shiftKey, WINDOW_KEY_STEP);
    if (!step) return;
    event.preventDefault();
    onRectChange(
      clampWindowRect(gestureRect(rect, step.mode, step.dx, step.dy), viewport(), minSize, minTop),
      true,
    );
  };

  return {
    frameRef,
    titleId,
    hintId,
    onMoveStart: (event: PointerEvent<HTMLElement>) => begin("move", event),
    onResizeStart: (event: PointerEvent<HTMLElement>) => begin("resize", event),
    onPointerMove,
    onPointerUp,
    onKeyDown,
  };
}
