"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { usePrefersReducedMotion } from "@/shared/hooks";

import { POINTER_DISTANCE, SORTABLE_INSTRUCTIONS } from "./SortableList.constants";
import type { SortableListProps } from "./SortableList.types";
import { reorderIndexes } from "./SortableList.utils";

/**
 * Drag and drop reordering for a vertical list (pointer or keyboard, from the item handle),
 * with Portuguese screen reader announcements.
 */
export function useSortableList<T extends { id: string }>({
  items,
  itemName,
  onMove,
}: Pick<SortableListProps<T>, "items" | "itemName" | "onMove">) {
  const reducedMotion = usePrefersReducedMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((item) => item.id);
  const nameOf = (id: string | number) => {
    const item = items.find((entry) => entry.id === String(id));
    return item ? itemName(item) : "";
  };
  const positionOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Pegou ${nameOf(active.id)}, posição ${positionOf(active.id)} de ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} na posição ${positionOf(over.id)} de ${ids.length}.`
        : `${nameOf(active.id)} fora da lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} solto na posição ${positionOf(over.id)} de ${ids.length}.`
        : `${nameOf(active.id)} solto.`,
    onDragCancel: ({ active }) => `Movimento de ${nameOf(active.id)} cancelado.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const indexes = reorderIndexes(ids, String(active.id), over ? String(over.id) : null);
    if (indexes && over) onMove(String(active.id), String(over.id));
  };

  return {
    ids,
    sensors,
    onDragEnd,
    reducedMotion,
    accessibility: {
      announcements,
      screenReaderInstructions: { draggable: SORTABLE_INSTRUCTIONS },
    },
  };
}
