"use client";

import { useState } from "react";

import type { IdentityDraft } from "@/modules/sheet/components/molecules";

import type { SheetHeaderProps } from "./SheetHeader.types";

/**
 * Draft-based identity editing in a modal.
 */
export function useSheetHeader({ character, onEdit }: SheetHeaderProps) {
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const open = () => setDraft({ ...character.sheet.identity });
  const close = () => setDraft(null);
  const change = (patch: Partial<IdentityDraft>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const save = () => {
    if (!draft) return;
    onEdit((sheet) => void (sheet.identity = draft));
    close();
  };
  return { draft, open, close, change, save };
}
