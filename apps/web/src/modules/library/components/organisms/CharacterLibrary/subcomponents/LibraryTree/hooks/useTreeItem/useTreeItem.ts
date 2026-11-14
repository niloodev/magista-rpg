"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { KeyboardEventHandler, PointerEventHandler } from "react";

import type { DropPosition } from "@/modules/library/library.types";

import type { IDropTarget } from "../../LibraryTree.types";

/**
 * A library tree row is both draggable and a drop target. Pointer drags start anywhere on the row;
 * keyboard drags only from the handle, so Enter on the link or toggle keeps working. The drop target is
 * disabled while the row cannot receive the dragged item (itself or, for folders, its own content).
 * Also tells where the dragged item would land on this row (characters never show "inside").
 */
export function useTreeItem(
  dragId: string,
  target: IDropTarget | null,
  excluded: string[],
  allowInside: boolean,
) {
  const draggable = useDraggable({ id: dragId });
  const droppable = useDroppable({ id: dragId, disabled: excluded.includes(dragId) });
  const position: DropPosition | null = target?.dragId === dragId ? target.position : null;
  return {
    setRowRef: (node: HTMLElement | null) => {
      draggable.setNodeRef(node);
      droppable.setNodeRef(node);
    },
    isDragging: draggable.isDragging,
    dropPosition: position === "inside" && !allowInside ? null : position,
    pointerProps: {
      onPointerDown: draggable.listeners?.onPointerDown as
        PointerEventHandler<HTMLElement> | undefined,
    },
    handleProps: {
      ...draggable.attributes,
      onKeyDown: draggable.listeners?.onKeyDown as KeyboardEventHandler<HTMLElement> | undefined,
    },
  };
}
