"use client";

import { useDroppable } from "@dnd-kit/core";

/**
 * Drop target that takes the dragged item out of every folder.
 */
export function useRootDropZone(dropId: string) {
  const { setNodeRef } = useDroppable({ id: dropId });
  return { setNodeRef };
}
