import type { ReactNode } from "react";

/** Position and size of a floating window, in CSS pixels of the viewport. */
export interface IWindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IWindowSize {
  width: number;
  height: number;
}

export interface FloatingWindowProps {
  title: string;
  rect: IWindowRect;
  zIndex: number;
  /** Called while dragging or resizing (`commit` false) and once more on release (`commit` true). */
  onRectChange: (rect: IWindowRect, commit: boolean) => void;
  /** Any press inside the window (to bring it to the front). */
  onActivate: () => void;
  onClose: () => void;
  closeLabel: string;
  /** Pointer position while the window is dragged by its title bar (`done` on release), for drop targets. */
  onDragPoint?: (point: { x: number; y: number }, done: boolean) => void;
  /** Translucent frame (the window is over a drop target that should show through). */
  ghost?: boolean;
  /** Extra buttons in the title bar, before "Fechar". */
  actions?: ReactNode;
  minSize?: IWindowSize;
  /** Highest the window may go (keeps a page header uncovered), in CSS pixels. */
  minTop?: number;
  children: ReactNode;
}
