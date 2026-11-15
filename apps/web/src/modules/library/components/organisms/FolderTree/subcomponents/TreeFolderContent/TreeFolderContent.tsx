"use client";

import { memo, useCallback } from "react";

import { FolderRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { useTreeRows } from "../../FolderTree.context";
import { DragHandle } from "../DragHandle";
import type { TreeFolderContentProps } from "./TreeFolderContent.types";

/**
 * The folder row itself, memoized so drag ticks of the tree do not redraw it unless its own state changed.
 */
export const TreeFolderContent = memo(function TreeFolderContent({
  folder,
  handleProps,
  dropPosition,
  dimmed,
}: TreeFolderContentProps) {
  const { labels, onToggleFolder } = useTreeRows();
  const onToggle = useCallback(() => onToggleFolder(folder.id), [onToggleFolder, folder.id]);
  return (
    <FolderRow
      name={folder.name}
      summary={folder.summary}
      expanded={folder.expanded}
      groupId={folder.groupId}
      onToggle={onToggle}
      dropPosition={dropPosition}
      dimmed={dimmed}
      handle={<DragHandle label={labels.moveFolder(folder.name)} {...handleProps} />}
      actions={<ActionMenu label={labels.folderActions(folder.name)} items={folder.menu} />}
    />
  );
});
