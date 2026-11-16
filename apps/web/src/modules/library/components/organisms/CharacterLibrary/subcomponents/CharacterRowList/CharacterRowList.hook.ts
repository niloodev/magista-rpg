"use client";

import type { ICharacterSummary } from "@magista/shared";
import { useEffect, useRef, useState, type DragEvent } from "react";

import type { ITreeOutsidePreview } from "@/modules/library/components/organisms/FolderTree";

import { EMPTY_DRAG_IMAGE_SRC } from "./CharacterRowList.constants";
import type { ICharacterRowDrag, ICharacterRowItem } from "./CharacterRowList.types";
import { startCharacterDrag } from "./CharacterRowList.utils";

/**
 * Native drag of the rows out of the list (a player placing a token): hides the browser's ghost and draws the
 * preview the GM tree shows. Like the tree, the pointer lives in a ref and moves the preview node directly;
 * React only re-renders when the drag starts, ends or crosses into or out of the drop spot.
 */
export function useCharacterRowDrag(
  items: ICharacterRowItem[],
  dragPreview: ITreeOutsidePreview<ICharacterSummary> | undefined,
) {
  const [drag, setDrag] = useState<ICharacterRowDrag | null>(null);
  const [over, setOver] = useState(false);
  const emptyImage = useRef<HTMLImageElement | null>(null);
  const previewNode = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef(dragPreview);
  const overRef = useRef(false);

  useEffect(() => {
    previewRef.current = dragPreview;
  });

  useEffect(() => {
    const image = new Image();
    image.src = EMPTY_DRAG_IMAGE_SRC;
    emptyImage.current = image;
  }, []);

  const draggedId = drag?.item.id ?? null;
  const stillListed = draggedId === null || items.some((item) => item.id === draggedId);

  useEffect(() => {
    if (draggedId === null) return;
    const follow = (event: globalThis.DragEvent) => {
      const point = { x: event.clientX, y: event.clientY };
      const node = previewNode.current;
      if (node) {
        node.style.left = `${point.x}px`;
        node.style.top = `${point.y}px`;
      }
      const isOver = previewRef.current?.isOver(point) ?? false;
      if (isOver !== overRef.current) {
        overRef.current = isOver;
        setOver(isOver);
      }
    };
    const stop = () => {
      overRef.current = false;
      setOver(false);
      setDrag(null);
    };
    window.addEventListener("dragover", follow, true);
    window.addEventListener("dragend", stop, true);
    window.addEventListener("drop", stop, true);
    return () => {
      window.removeEventListener("dragover", follow, true);
      window.removeEventListener("dragend", stop, true);
      window.removeEventListener("drop", stop, true);
    };
  }, [draggedId]);

  const onDragStart = (event: DragEvent<HTMLElement>, item: ICharacterRowItem) => {
    startCharacterDrag(event, item.id);
    if (emptyImage.current) event.dataTransfer.setDragImage(emptyImage.current, 0, 0);
    overRef.current = false;
    setOver(false);
    setDrag({ item, point: { x: event.clientX, y: event.clientY } });
  };

  return { drag: stillListed ? drag : null, over, previewNode, onDragStart };
}
