"use client";

import { memo } from "react";

import { useTreeItem } from "../../hooks";
import { TreeLeafContent } from "../TreeLeafContent";
import type { TreeLeafProps } from "./TreeLeaf.types";

export const TreeLeaf = memo(function TreeLeaf({ leaf }: TreeLeafProps) {
  const { setRowRef, isDragging, dropPosition, pointerProps, handleProps } = useTreeItem(
    leaf.dragId,
    false,
  );
  return (
    <li ref={setRowRef} {...pointerProps} className="select-none">
      <TreeLeafContent
        leaf={leaf}
        handleProps={handleProps}
        dropPosition={dropPosition}
        dimmed={isDragging}
      />
    </li>
  );
});
