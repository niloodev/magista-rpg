"use client";

import { Icon } from "@/shared/components/atoms";

import { useActionMenu } from "./ActionMenu.hook";
import type { ActionMenuProps } from "./ActionMenu.types";

export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const {
    open,
    alignStart,
    menuId,
    buttonRef,
    menuRef,
    toggle,
    onButtonKeyDown,
    onMenuKeyDown,
    select,
  } = useActionMenu();
  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        onKeyDown={onButtonKeyDown}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-transparent bg-black/50 text-muted-strong transition-colors duration-200 hover:border-primary/40 hover:bg-black/70 aria-expanded:border-primary/60"
      >
        <Icon name="ellipsis-vertical" size={18} />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute top-full z-30 mt-1 w-52 ${alignStart ? "left-0" : "right-0"} animate-slide-down-in border border-primary/40 bg-void-800/95 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => select(item)}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 text-left font-sans text-sm transition-colors duration-150 hover:bg-white/5 focus-visible:bg-white/5 ${item.destructive ? "text-error" : "text-foreground"}`}
            >
              <Icon name={item.icon} size={16} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
