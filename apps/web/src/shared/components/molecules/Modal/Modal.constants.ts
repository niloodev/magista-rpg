import type { ModalSize } from "./Modal.types";

export const MODAL_SIZES: Record<ModalSize, string> = {
  sm: "w-[min(92vw,440px)]",
  md: "w-[min(94vw,640px)]",
  lg: "w-[min(96vw,860px)]",
};

export const AUTOFOCUS_SELECTOR = "[data-autofocus]";

export const FIELD_SELECTOR = "input:not([type=hidden]), select, textarea";
