"use client";

import { DragHandle } from "../DragHandle";
import { useTreeItem } from "../../hooks";
import type { TreeLeafProps } from "./TreeLeaf.types";

export function TreeLeaf({ leaf, target, excluded, labels }: TreeLeafProps) {
  const { setRowRef, isDragging, dropPosition, pointerProps, handleProps } = useTreeItem(
    leaf.dragId,
    target,
    excluded,
    false,
  );
  return (
    <li ref={setRowRef} {...pointerProps} className="select-none">
      {leaf.render({
        handle: <DragHandle label={labels.moveLeaf(leaf.name)} {...handleProps} />,
        dropPosition,
        dimmed: isDragging,
      })}
    </li>
  );
}
