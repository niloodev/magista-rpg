"use client";

import { Icon } from "@/shared/components/atoms";

import { WINDOW_KEYS_HINT } from "./FloatingWindow.constants";
import { useFloatingWindow } from "./FloatingWindow.hook";
import type { FloatingWindowProps } from "./FloatingWindow.types";

/**
 * Non-modal window floating over a page (like the Roll20 sheet windows): title bar to drag, corner to resize,
 * Alt+arrows from the keyboard. Positioned with left/top (no transform or blur on the frame), so overlays inside
 * it that use `position: fixed` still cover the whole screen.
 */
export function FloatingWindow(props: FloatingWindowProps) {
  const { title, rect, zIndex, onActivate, onClose, closeLabel, actions, ghost, children } = props;
  const {
    frameRef,
    titleId,
    hintId,
    onMoveStart,
    onResizeStart,
    onPointerMove,
    onPointerUp,
    onKeyDown,
  } = useFloatingWindow(props);
  return (
    <section
      ref={frameRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={hintId}
      tabIndex={-1}
      onPointerDownCapture={onActivate}
      onFocusCapture={onActivate}
      onKeyDown={onKeyDown}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, zIndex }}
      className={`fixed flex flex-col border border-primary/40 transition-opacity duration-150 ${ghost ? "opacity-50" : ""} bg-void-900 shadow-[0_24px_64px_rgba(0,0,0,0.75),0_0_0_1px_rgba(0,0,0,0.6)] focus-visible:outline-offset-[-2px] has-[[data-window-body]:focus-visible]:outline-2 has-[[data-window-body]:focus-visible]:outline-offset-[-2px] has-[[data-window-body]:focus-visible]:outline-ruby-400 has-[[data-window-body]:focus-visible]:outline-solid`}
    >
      <p id={hintId} className="sr-only">
        {WINDOW_KEYS_HINT}
      </p>
      <header
        onPointerDown={onMoveStart}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-11 shrink-0 cursor-move touch-none items-center gap-2 border-b border-border bg-black/70 pr-1 pl-3 select-none"
      >
        <Icon name="grip-vertical" size={16} aria-hidden="true" className="text-muted-strong" />
        <h2
          id={titleId}
          className="min-w-0 flex-1 truncate font-serif text-sm tracking-wide text-foreground"
        >
          {title}
        </h2>
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-muted-strong transition-colors hover:bg-white/5 hover:text-accent-text"
        >
          <Icon name="x" size={18} aria-hidden="true" />
        </button>
      </header>
      <div
        tabIndex={0}
        aria-labelledby={titleId}
        data-window-body=""
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none"
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        onPointerDown={onResizeStart}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute right-0 bottom-0 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-0.5 text-primary/70"
      >
        <span className="h-2.5 w-2.5 border-r-2 border-b-2 border-current" />
      </span>
    </section>
  );
}
