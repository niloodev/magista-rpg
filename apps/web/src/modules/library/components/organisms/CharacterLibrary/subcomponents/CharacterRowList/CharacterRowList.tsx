"use client";

import { createPortal } from "react-dom";

import { CharacterRow, DragPreview } from "@/modules/library/components/molecules";
import { ActionMenu } from "@/shared/components/molecules";
import { useDocumentBody } from "@/shared/hooks";

import { useCharacterRowDrag } from "./CharacterRowList.hook";
import type { CharacterRowListProps } from "./CharacterRowList.types";

export function CharacterRowList({
  label,
  items,
  emptyText,
  onOpen,
  draggable = false,
  dragPreview,
}: CharacterRowListProps) {
  const { drag, over, previewNode, onDragStart } = useCharacterRowDrag(items, dragPreview);
  const overlayRoot = useDocumentBody();
  if (items.length === 0)
    return <p className="py-10 text-center font-sans text-base text-muted-strong">{emptyText}</p>;
  return (
    <>
      <ul aria-label={label} className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            draggable={draggable}
            onDragStart={draggable ? (event) => onDragStart(event, item) : undefined}
            className={`${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${
              drag?.item.id === item.id ? "opacity-40" : ""
            }`}
          >
            <CharacterRow
              id={item.id}
              name={item.name}
              subtitle={item.subtitle}
              href={item.href}
              onOpen={onOpen && (() => onOpen(item.id))}
              portraitUrl={item.portraitUrl}
              path={item.path}
              accountLabels={item.accountLabels}
              features={item.features}
              actions={
                item.menu && <ActionMenu label={`Ações de ${item.name}`} items={item.menu} />
              }
            />
          </li>
        ))}
      </ul>
      {drag &&
        overlayRoot &&
        createPortal(
          <div
            ref={previewNode}
            aria-hidden="true"
            className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-1/2"
            style={{ left: drag.point.x, top: drag.point.y }}
          >
            {over && drag.item.character && dragPreview ? (
              dragPreview.render(drag.item.character)
            ) : (
              <div className="w-80">
                <DragPreview
                  kind="leaf"
                  name={drag.item.name}
                  portraitUrl={drag.item.portraitUrl}
                />
              </div>
            )}
          </div>,
          overlayRoot,
        )}
    </>
  );
}
