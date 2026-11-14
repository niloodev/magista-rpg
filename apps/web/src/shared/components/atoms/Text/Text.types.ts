import type { ElementType, HTMLAttributes } from "react";

export type TextVariant =
  "h1" | "h2" | "h3" | "body" | "label" | "fieldLabel" | "micro" | "lore" | "hint";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: ElementType;
  htmlFor?: string;
}
