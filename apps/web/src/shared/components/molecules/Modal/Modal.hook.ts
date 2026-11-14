"use client";

import { useEffect, useId, useRef, type MouseEvent, type SyntheticEvent } from "react";

import { AUTOFOCUS_SELECTOR, FIELD_SELECTOR } from "./Modal.constants";
import type { ModalProps } from "./Modal.types";

/**
 * Syncs the native <dialog> with the open prop and focuses the first field (or [data-autofocus]). showModal() gives focus trapping, Esc and focus return.
 */
export function useModal({ open, onClose }: Pick<ModalProps, "open" | "onClose">) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const target =
        dialog.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR) ??
        dialog.querySelector<HTMLElement>(FIELD_SELECTOR);
      target?.focus();
    }
    if (!open && dialog.open) dialog.close();
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
