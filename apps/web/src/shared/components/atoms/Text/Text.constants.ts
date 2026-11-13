import type { ElementType } from "react";

import type { TextVariant } from "./Text.types";

export const TEXT_VARIANTS: Record<TextVariant, string> = {
  h1: "font-serif text-4xl text-foreground",
  h2: "font-serif text-2xl text-foreground",
  h3: "font-sans text-sm font-bold uppercase tracking-[0.2em] text-primary",
  body: "font-sans text-sm text-muted-foreground",
  label: "block font-serif text-[0.62rem] uppercase tracking-[0.2em] text-label",
  micro: "font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-primary",
  lore: "font-sans text-sm italic text-muted-foreground",
  hint: "font-sans text-xs italic leading-relaxed text-hint",
};

export const TEXT_ELEMENTS: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  label: "label",
  micro: "span",
  lore: "p",
  hint: "p",
};
