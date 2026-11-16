import type { TokenStyle } from "@magista/shared";

export interface TokenStyleChoiceProps {
  /** Base id of the radio group (each option gets its own id from it). */
  id: string;
  legend: string;
  value: TokenStyle;
  onChange: (style: TokenStyle) => void;
  /** Image shown in each option, when there is one. */
  portraitUrl?: string | null;
  figureUrl?: string | null;
  /** Reason the figure cannot be chosen yet (no isometric image); disables that option. */
  figureDisabledReason?: string | null;
}

export interface ITokenStyleOption {
  style: TokenStyle;
  label: string;
  description: string;
}
