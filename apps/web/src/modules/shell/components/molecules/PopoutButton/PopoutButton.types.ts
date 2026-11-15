import type { IPopoutTarget } from "@/core/services/windows";

export type PopoutButtonVariant = "icon" | "button";

export interface PopoutButtonProps {
  target: IPopoutTarget;
  /** Accessible name of the icon variant, e.g. "Abrir ficha de Kael em janela" (the button variant shows its text). */
  label: string;
  variant?: PopoutButtonVariant;
}
