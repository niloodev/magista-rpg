"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Sortable wiring of one list item; the drag listeners go on the handle only.
 */
export function useSortableItem(id: string, animate: boolean) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return {
    setNodeRef,
    style: {
      transform: CSS.Translate.toString(transform),
      transition: animate ? transition : undefined,
    },
    isDragging,
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
  };
}
