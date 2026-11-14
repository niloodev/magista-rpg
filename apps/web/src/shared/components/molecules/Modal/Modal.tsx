"use client";

import { Icon } from "@/shared/components/atoms";

import { MODAL_SIZES } from "./Modal.constants";
import { useModal } from "./Modal.hook";
import type { ModalProps } from "./Modal.types";

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const { dialogRef, titleId, descriptionId, onCancel, onBackdropClick } = useModal({
    open,
    onClose,
  });
  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      onClick={onBackdropClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={`m-auto max-h-[92vh] max-w-none border border-primary/50 bg-void-800 p-0 text-foreground shadow-[0_0_60px_rgba(218,32,84,0.3)] backdrop:bg-black/80 backdrop:backdrop-blur-sm open:animate-pop-in ${MODAL_SIZES[size]}`}
    >
      {open && (
        <div className="flex max-h-[92vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <h2 id={titleId} className="font-serif text-xl text-foreground">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 font-sans text-sm text-muted-strong">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-muted-strong transition-colors hover:text-foreground"
            >
              <Icon name="x" size={20} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-black/30 px-5 py-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
