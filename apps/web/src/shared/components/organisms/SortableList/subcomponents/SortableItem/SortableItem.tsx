"use client";

import { Icon } from "@/shared/components/atoms/Icon";

import { useSortableItem } from "./SortableItem.hook";
import type { SortableItemProps } from "./SortableItem.types";

export function SortableItem({ id, name, animate, children }: SortableItemProps) {
  const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id, animate);
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative flex items-stretch gap-2 ${isDragging ? "z-20 opacity-90 shadow-[0_12px_32px_rgba(0,0,0,0.6)]" : ""}`}
    >
      <button
        type="button"
        {...handleProps}
        aria-label={`Reordenar ${name}`}
        className="flex w-8 shrink-0 cursor-grab touch-none items-center justify-center border border-white/10 bg-black/40 text-muted-strong transition-colors duration-200 hover:border-primary/40 hover:text-foreground active:cursor-grabbing"
      >
        <Icon name="grip-vertical" size={18} aria-hidden="true" />
      </button>
      {children}
    </li>
  );
}
