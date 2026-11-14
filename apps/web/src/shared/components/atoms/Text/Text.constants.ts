import type { ElementType } from "react";

import type { TextVariant } from "./Text.types";

export const TEXT_VARIANTS: Record<TextVariant, string> = {
  h1: "font-serif text-4xl text-foreground",
  h2: "font-serif text-2xl text-foreground",
  h3: "font-sans text-[15px] font-bold uppercase tracking-[0.18em] text-accent-text",
  body: "font-sans text-[15px] leading-relaxed text-muted-strong",
  label: "block font-serif text-[0.62rem] uppercase tracking-[0.2em] text-label",
  fieldLabel: "block font-sans text-xs font-semibold uppercase tracking-[0.12em] text-label",
  micro: "font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-accent-text",
  lore: "font-sans text-[15px] italic text-muted-strong",
  hint: "font-sans text-xs italic leading-relaxed text-hint",
};

export const TEXT_ELEMENTS: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  label: "label",
  fieldLabel: "label",
  micro: "span",
  lore: "p",
  hint: "p",
};
