"use client";

import { useRef, useState, type DragEvent } from "react";

import { CHARACTER_DRAG_TYPE } from "@/modules/library/library.constants";

import type { ArenaMapDrag, UseArenaFileDropProps } from "./useArenaFileDrop.types";

/**
 * What is dragged over the map from outside the board: image files from the computer (GM) or a sheet row from
 * a player's list. Tells what hovers (to show the drop hint) and hands it over with the page point on drop;
 * without the matching handler nothing happens.
 */
export function useArenaFileDrop({ onDropFiles, onDropCharacterId }: UseArenaFileDropProps) {
  const [dragging, setDragging] = useState<ArenaMapDrag | null>(null);
  const depth = useRef(0);

  const kindOf = (event: DragEvent<HTMLElement>): ArenaMapDrag | null => {
    const types = event.dataTransfer.types;
    if (onDropCharacterId && types.includes(CHARACTER_DRAG_TYPE)) return "character";
    if (onDropFiles && types.includes("Files")) return "files";
    return null;
  };

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    const kind = kindOf(event);
    if (!kind) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(kind);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!kindOf(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!kindOf(event)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(null);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    const kind = kindOf(event);
    if (!kind) return;
    event.preventDefault();
    depth.current = 0;
    setDragging(null);
    const point = { x: event.clientX, y: event.clientY };
    if (kind === "character") {
      onDropCharacterId?.(event.dataTransfer.getData(CHARACTER_DRAG_TYPE), point);
      return;
    }
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    onDropFiles?.(files, point);
  };

  return { dragging, dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
