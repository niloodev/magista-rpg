"use client";

import { createElement, useMemo } from "react";

import { useTreeRows } from "../../FolderTree.context";
import type { ITreeLeafSlots } from "../../FolderTree.types";
import { DragHandle } from "../DragHandle";
import type { TreeLeafContentProps } from "./TreeLeafContent.types";

/**
 * The slots handed to the tree's `renderLeaf`, kept stable while the row state is, so memoized leaf rows
 * (characters, scenes) skip renders too.
 */
export function useTreeLeafContent({
  leaf,
  handleProps,
  dropPosition,
  dimmed,
}: TreeLeafContentProps) {
  const { labels, renderLeaf } = useTreeRows();
  const slots = useMemo<ITreeLeafSlots>(
    () => ({
      handle: createElement(DragHandle, { label: labels.moveLeaf(leaf.name), ...handleProps }),
      dropPosition,
      dimmed,
    }),
    [labels, leaf.name, handleProps, dropPosition, dimmed],
  );
  return { slots, renderLeaf };
}
