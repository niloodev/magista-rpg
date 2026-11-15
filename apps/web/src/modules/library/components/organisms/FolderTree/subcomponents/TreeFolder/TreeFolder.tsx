"use client";

import { memo } from "react";

import { useTreeRows } from "../../FolderTree.context";
import { useTreeItem } from "../../hooks";
import { TreeFolderContent } from "../TreeFolderContent";
import { TreeLeaf } from "../TreeLeaf";
import type { TreeFolderProps } from "./TreeFolder.types";

export const TreeFolder = memo(function TreeFolder({ folder }: TreeFolderProps) {
  const { labels } = useTreeRows();
  const { setRowRef, isDragging, dropPosition, pointerProps, handleProps } = useTreeItem(
    folder.dragId,
    true,
  );
  return (
    <li className="select-none">
      <div ref={setRowRef} {...pointerProps}>
        <TreeFolderContent
          folder={folder}
          handleProps={handleProps}
          dropPosition={dropPosition}
          dimmed={isDragging}
        />
      </div>
      {folder.expanded && (
        <ul
          id={folder.groupId}
          aria-label={`Conteúdo de ${folder.name}`}
          className={`space-y-2 border border-t-0 border-teal-500/50 bg-teal-900/10 py-3 pr-2 pl-3 @sm:pl-5 ${isDragging ? "opacity-40" : ""}`}
        >
          {folder.folders.map((child) => (
            <TreeFolder key={child.id} folder={child} />
          ))}
          {folder.leaves.map((leaf) => (
            <TreeLeaf key={leaf.id} leaf={leaf} />
          ))}
          {folder.empty && (
            <li className="py-2 font-sans text-sm text-muted-strong italic">
              {labels.emptyFolder}
            </li>
          )}
        </ul>
      )}
    </li>
  );
});
