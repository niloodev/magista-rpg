"use client";

import { useRef, type MouseEvent } from "react";

/**
 * Opens and closes the native modal dialog (Esc and backdrop click close it).
 */
export function useArtDialog() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };
  return { dialogRef, open, close, onBackdropClick };
}
