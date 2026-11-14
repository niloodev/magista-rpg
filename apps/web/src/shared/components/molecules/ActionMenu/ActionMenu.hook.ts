"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { MENU_ITEM_SELECTOR, MENU_MIN_WIDTH_PX, VIEWPORT_GUTTER_PX } from "./ActionMenu.constants";
import type { ActionMenuItem } from "./ActionMenu.types";

/**
 * Menu button behaviour (WAI-ARIA menu pattern): opens on click or arrows, moves focus with arrows,
 * Home/End, closes on Esc, Tab or outside click and returns focus to the button.
 */
export function useActionMenu() {
  const [open, setOpen] = useState(false);
  const [alignStart, setAlignStart] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const itemsOf = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []);

  const focusItem = (index: number) => {
    const items = itemsOf();
    if (items.length === 0) return;
    items[(index + items.length) % items.length]?.focus();
  };

  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    setAlignStart(rect ? rect.right < MENU_MIN_WIDTH_PX + VIEWPORT_GUTTER_PX : false);
    setOpen((current) => !current);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus(),
    );
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !open) {
      event.preventDefault();
      toggle();
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = itemsOf();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      focusItem(moves[event.key] ?? 0);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const select = (item: ActionMenuItem) => {
    close();
    item.onSelect();
  };

  return {
    open,
    menuId,
    buttonRef,
    menuRef,
    alignStart,
    toggle,
    onButtonKeyDown,
    onMenuKeyDown,
    select,
  };
}
