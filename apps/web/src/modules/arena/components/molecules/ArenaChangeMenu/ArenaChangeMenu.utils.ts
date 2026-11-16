import type { KeyboardEvent } from "react";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside the menu: from the last control it goes back to the first and the other way around (radio
 * groups count as one stop, as the browser moves inside them with the arrows).
 */
export function keepFocusInside(root: HTMLElement, event: KeyboardEvent<HTMLElement>): void {
  const stops = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !(element instanceof HTMLInputElement && element.type === "radio" && !element.checked),
  );
  const first = stops[0];
  const last = stops.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Where the menu opens when called from the keyboard: centered above the selection bar.
 */
export function barAnchor(
  bar: { left: number; top: number; width: number },
  size: { width: number; height: number },
): { x: number; y: number } {
  return { x: bar.left + bar.width / 2 - size.width / 2, y: bar.top - size.height - 12 };
}
