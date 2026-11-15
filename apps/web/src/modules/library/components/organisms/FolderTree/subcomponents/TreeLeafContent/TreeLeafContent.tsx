"use client";

import { memo } from "react";

import { useTreeLeafContent } from "./TreeLeafContent.hook";
import type { TreeLeafContentProps } from "./TreeLeafContent.types";

/**
 * The leaf row drawn by the tree's `renderLeaf`, memoized so drag ticks only redraw rows whose state changed.
 */
export const TreeLeafContent = memo(function TreeLeafContent(props: TreeLeafContentProps) {
  const { slots, renderLeaf } = useTreeLeafContent(props);
  return renderLeaf(props.leaf.leaf, slots);
});
