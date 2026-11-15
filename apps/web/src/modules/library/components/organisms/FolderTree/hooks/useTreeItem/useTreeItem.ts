"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  useMemo,
  useSyncExternalStore,
  type KeyboardEventHandler,
  type PointerEventHandler,
} from "react";

import type { DropPosition } from "@/modules/library/library.types";

import { useTreeRows } from "../../FolderTree.context";

/**
 * A library tree row is both draggable and a drop target. Pointer drags start anywhere on the row;
 * keyboard drags only from the handle, so Enter on the link or toggle keeps working. The drop target is
 * disabled while the row cannot receive the dragged item (itself or, for folders, its own content).
 * Also tells where the dragged item would land on this row (characters never show "inside"). The row reads
 * the drag state from the tree store, so it only re-renders when its own answer changes.
 */
export function useTreeItem(dragId: string, allowInside: boolean) {
  const { rows } = useTreeRows();
  const position = useSyncExternalStore(
    rows.subscribe,
    () => rows.positionOf(dragId),
    () => null,
  );
  const excluded = useSyncExternalStore(
    rows.subscribe,
    () => rows.isExcluded(dragId),
    () => false,
  );
  const draggable = useDraggable({ id: dragId });
  const droppable = useDroppable({ id: dragId, disabled: excluded });
  const { setNodeRef: setDragRef, listeners, attributes } = draggable;
  const { setNodeRef: setDropRef } = droppable;
  const onPointerDown = listeners?.onPointerDown as PointerEventHandler<HTMLElement> | undefined;
  const onKeyDown = listeners?.onKeyDown as KeyboardEventHandler<HTMLElement> | undefined;
  const setRowRef = useMemo(
    () => (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );
  const pointerProps = useMemo(() => ({ onPointerDown }), [onPointerDown]);
  const handleProps = useMemo(() => ({ ...attributes, onKeyDown }), [attributes, onKeyDown]);
  const dropPosition: DropPosition | null = position === "inside" && !allowInside ? null : position;
  return { setRowRef, isDragging: draggable.isDragging, dropPosition, pointerProps, handleProps };
}
