"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { lockToVerticalAxis } from "./SortableList.constants";
import { useSortableList } from "./SortableList.hook";
import type { SortableListProps } from "./SortableList.types";
import { SortableItem } from "./subcomponents";

export function SortableList<T extends { id: string }>({
  label,
  items,
  itemName,
  onMove,
  renderItem,
  className,
}: SortableListProps<T>) {
  const { ids, sensors, onDragEnd, reducedMotion, accessibility } = useSortableList({
    items,
    itemName,
    onMove,
  });
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[lockToVerticalAxis]}
      accessibility={accessibility}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-label={label} className={className ?? "space-y-3"}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} name={itemName(item)} animate={!reducedMotion}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
