"use client";

import { Icon } from "@/shared/components/atoms";

import { useArenaTokenMenu } from "./ArenaTokenMenu.hook";
import type { ArenaTokenMenuProps } from "./ArenaTokenMenu.types";

/**
 * Right-click menu of the tokens on the map: "Aplicar mudança" and, for the GM, the token actions (configure,
 * hide, copy, paste, remove), plus "Abrir ficha" for a sheet the viewer can open.
 */
export function ArenaTokenMenu({ label, anchor, items, onClose }: ArenaTokenMenuProps) {
  const { menuRef, style, onKeyDown, onContextMenu, select } = useArenaTokenMenu({
    anchor,
    onClose,
  });
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      style={style}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      className="fixed z-40 w-56 animate-slide-down-in border border-primary/40 bg-void-800/95 py-1 [clip-path:var(--magista-clip-panel)] shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md lite:backdrop-blur-none"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={() => select(item)}
          className={`flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 text-left font-sans text-sm transition-colors duration-150 hover:bg-white/5 focus-visible:bg-white/5 ${
            item.separated ? "border-t border-white/10" : ""
          } ${item.destructive ? "text-error" : "text-foreground"}`}
        >
          <Icon name={item.icon} size={16} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
