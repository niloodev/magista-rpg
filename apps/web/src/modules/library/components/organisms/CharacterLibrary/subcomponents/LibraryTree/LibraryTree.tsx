"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";

import { Button, Icon } from "@/shared/components/atoms";
import { lockToVerticalAxis } from "@/shared/components/organisms";

import { EMPTY_LIBRARY_TEXT } from "./LibraryTree.constants";
import { useLibraryTree } from "./LibraryTree.hook";
import type { LibraryTreeProps } from "./LibraryTree.types";
import { DragPreview, RootDropZone, TreeCharacter, TreeFolder } from "./subcomponents";

export function LibraryTree(props: LibraryTreeProps) {
  const {
    folders,
    characters,
    isEmpty,
    dragging,
    target,
    excluded,
    rootDropId,
    rootDropActive,
    preview,
    overlayRoot,
    sensors,
    collision,
    reducedMotion,
    accessibility,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
    newFolder,
    newCharacter,
  } = useLibraryTree(props);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      modifiers={[lockToVerticalAxis]}
      accessibility={accessibility}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex flex-col gap-3">
        <RootDropZone dropId={rootDropId} active={rootDropActive} dragging={dragging} />
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 border border-dashed border-white/15 px-6 py-12 text-center">
            <Icon name="folder-open" size={40} aria-hidden="true" className="text-teal-400" />
            <p className="font-sans text-base text-muted-strong">{EMPTY_LIBRARY_TEXT}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={newFolder}
                icon={<Icon name="folder-plus" size={14} />}
              >
                Nova pasta
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={newCharacter}
                icon={<Icon name="file-plus" size={14} />}
              >
                Nova ficha
              </Button>
            </div>
          </div>
        ) : (
          <ul aria-label="Pastas e fichas" className="space-y-2">
            {folders.map((folder) => (
              <TreeFolder key={folder.id} folder={folder} target={target} excluded={excluded} />
            ))}
            {characters.map((character) => (
              <TreeCharacter
                key={character.id}
                character={character}
                target={target}
                excluded={excluded}
              />
            ))}
          </ul>
        )}
      </div>
      {overlayRoot &&
        createPortal(
          <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
            {preview && (
              <DragPreview
                kind={preview.kind}
                name={preview.name}
                portraitUrl={preview.portraitUrl}
              />
            )}
          </DragOverlay>,
          overlayRoot,
        )}
    </DndContext>
  );
}
