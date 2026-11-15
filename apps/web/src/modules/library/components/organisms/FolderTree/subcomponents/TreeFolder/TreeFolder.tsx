"use client";

import { FolderRow } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";

import { DragHandle } from "../DragHandle";
import { TreeLeaf } from "../TreeLeaf";
import { useTreeItem } from "../../hooks";
import type { TreeFolderProps } from "./TreeFolder.types";

export function TreeFolder({ folder, target, excluded, labels }: TreeFolderProps) {
  const { setRowRef, isDragging, dropPosition, pointerProps, handleProps } = useTreeItem(
    folder.dragId,
    target,
    excluded,
    true,
  );
  return (
    <li className="select-none">
      <div ref={setRowRef} {...pointerProps}>
        <FolderRow
          name={folder.name}
          summary={folder.summary}
          expanded={folder.expanded}
          groupId={folder.groupId}
          onToggle={folder.onToggle}
          dropPosition={dropPosition}
          dimmed={isDragging}
          handle={<DragHandle label={labels.moveFolder(folder.name)} {...handleProps} />}
          actions={<ActionMenu label={labels.folderActions(folder.name)} items={folder.menu} />}
        />
      </div>
      {folder.expanded && (
        <ul
          id={folder.groupId}
          aria-label={`Conteúdo de ${folder.name}`}
          className={`space-y-2 border border-t-0 border-teal-500/50 bg-teal-900/10 py-3 pr-2 pl-3 @sm:pl-5 ${isDragging ? "opacity-40" : ""}`}
        >
          {folder.folders.map((child) => (
            <TreeFolder
              key={child.id}
              folder={child}
              target={target}
              excluded={excluded}
              labels={labels}
            />
          ))}
          {folder.leaves.map((leaf) => (
            <TreeLeaf
              key={leaf.id}
              leaf={leaf}
              target={target}
              excluded={excluded}
              labels={labels}
            />
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
}
