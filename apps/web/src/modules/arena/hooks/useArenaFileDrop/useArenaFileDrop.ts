"use client";

import { useRef, useState, type DragEvent } from "react";

/**
 * Image files dragged from the computer over the map: tells when they hover (to show the drop hint) and hands
 * the images and the page point over on drop. Without `onDropFiles` (players, no scene) nothing happens.
 */
export function useArenaFileDrop(
  onDropFiles: ((files: File[], point: { x: number; y: number }) => void) | undefined,
) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const carriesFiles = (event: DragEvent<HTMLElement>) =>
    Boolean(onDropFiles) && event.dataTransfer.types.includes("Files");

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(true);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!carriesFiles(event)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    onDropFiles?.(files, { x: event.clientX, y: event.clientY });
  };

  return { dragging, dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
