"use client";

import { useEffect, useId, useRef, type MouseEvent, type SyntheticEvent } from "react";

import { AUTOFOCUS_SELECTOR, FIELD_SELECTOR } from "./Modal.constants";
import type { ModalProps } from "./Modal.types";

/**
 * Syncs the native <dialog> with the open prop and focuses the first field (or [data-autofocus]). showModal() gives
 * focus trapping and Esc; focus goes back to what had it before opening, also when the modal is unmounted while
 * open (its content leaves the page before the dialog closes, so the browser alone would drop it on the body).
 */
export function useModal({ open, onClose }: Pick<ModalProps, "open" | "onClose">) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const target =
      dialog.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR) ??
      dialog.querySelector<HTMLElement>(FIELD_SELECTOR);
    target?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return { dialogRef, titleId, descriptionId, onCancel, onBackdropClick };
}
