"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import { TOKEN_MENU_ITEM_SELECTOR } from "./ArenaTokenMenu.constants";
import type { ArenaTokenMenuProps, IArenaTokenMenuItem } from "./ArenaTokenMenu.types";
import { menuPosition } from "./ArenaTokenMenu.utils";

/**
 * Context menu behaviour (WAI-ARIA menu): placed at the click inside the window, focus on the first item,
 * arrows, Home and End move, Esc, Tab or a click outside close it.
 */
export function useArenaTokenMenu({
  anchor,
  onClose,
}: Pick<ArenaTokenMenuProps, "anchor" | "onClose">) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    setPosition(
      menuPosition(
        anchor,
        { width: rect.width, height: rect.height },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [anchor]);

  const placed = position !== null;

  useEffect(() => {
    if (placed) menuRef.current?.querySelector<HTMLElement>(TOKEN_MENU_ITEM_SELECTOR)?.focus();
  }, [placed]);

  useEffect(() => {
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const menu = menuRef.current;
    return () => {
      const active = document.activeElement;
      const lost = !active || active === document.body || (menu?.contains(active) ?? false);
      if (lost && returnTo?.isConnected) returnTo.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(TOKEN_MENU_ITEM_SELECTOR) ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      const index = moves[event.key] ?? 0;
      items[(index + items.length) % items.length]?.focus();
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  const select = (item: IArenaTokenMenuItem) => {
    onClose();
    item.onSelect();
  };

  return {
    menuRef,
    style: {
      left: position?.x ?? anchor.x,
      top: position?.y ?? anchor.y,
      visibility: position ? ("visible" as const) : ("hidden" as const),
    },
    onKeyDown,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    select,
  };
}
