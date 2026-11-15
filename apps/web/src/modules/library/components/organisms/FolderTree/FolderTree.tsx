"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";

import type { ITreeLeaf } from "@/modules/library/library.types";
import { lockToVerticalAxis } from "@/shared/components/organisms";

import { useFolderTree } from "./FolderTree.hook";
import type { FolderTreeProps } from "./FolderTree.types";
import { DragPreview, RootDropZone, TreeFolder, TreeLeaf } from "./subcomponents";

export function FolderTree<L extends ITreeLeaf>(props: FolderTreeProps<L>) {
  const { labels, empty, freeAxis = false, leafIcon } = props;
  const {
    folders,
    leaves,
    isEmpty,
    dragging,
    target,
    excluded,
    rootDropId,
    rootDropActive,
    preview,
    outside,
    outsideNode,
    overlayRoot,
    sensors,
    collision,
    reducedMotion,
    accessibility,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
  } = useFolderTree(props);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      modifiers={freeAxis ? [] : [lockToVerticalAxis]}
      accessibility={accessibility}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex flex-col gap-3">
        <RootDropZone
          dropId={rootDropId}
          active={rootDropActive}
          dragging={dragging}
          idleLabel={labels.rootIdle}
          draggingLabel={labels.rootDragging}
        />
        {isEmpty ? (
          empty
        ) : (
          <ul aria-label={labels.list} className="space-y-2">
            {folders.map((folder) => (
              <TreeFolder
                key={folder.id}
                folder={folder}
                target={target}
                excluded={excluded}
                labels={labels}
              />
            ))}
            {leaves.map((leaf) => (
              <TreeLeaf
                key={leaf.id}
                leaf={leaf}
                target={target}
                excluded={excluded}
                labels={labels}
              />
            ))}
          </ul>
        )}
      </div>
      {overlayRoot &&
        createPortal(
          <DragOverlay
            dropAnimation={reducedMotion ? null : undefined}
            className="pointer-events-none"
          >
            {preview && !outside && (
              <DragPreview
                kind={preview.kind}
                name={preview.name}
                portraitUrl={preview.portraitUrl}
                leafIcon={leafIcon}
              />
            )}
          </DragOverlay>,
          overlayRoot,
        )}
      {overlayRoot &&
        outside &&
        createPortal(
          <div
            ref={outsideNode}
            aria-hidden="true"
            className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-1/2"
            style={{ left: outside.point.x, top: outside.point.y }}
          >
            {outside.node}
          </div>,
          overlayRoot,
        )}
    </DndContext>
  );
}
