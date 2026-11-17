"use client";

import type { ISheetEffects } from "@magista/shared";
import { useState } from "react";

import type { IdentityDraft } from "@/modules/sheet/components/molecules";
import { useAppStoreApi } from "@/modules/shell/store";

import type { SheetHeaderProps } from "./SheetHeader.types";

/**
 * Draft-based identity editing in a modal, the sheet animations dialog and the GM images dialog.
 */
export function useSheetHeader({ character, onEdit }: SheetHeaderProps) {
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);
  const store = useAppStoreApi();
  const open = () => setDraft({ ...character.sheet.identity });
  const close = () => setDraft(null);
  const change = (patch: Partial<IdentityDraft>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const save = () => {
    if (!draft) return;
    onEdit((sheet) => void (sheet.identity = draft));
    close();
  };
  return {
    draft,
    open,
    close,
    change,
    save,
    effectsOpen,
    openEffects: () => setEffectsOpen(true),
    closeEffects: () => setEffectsOpen(false),
    saveEffects: (effects: ISheetEffects) => {
      onEdit((sheet) => void (sheet.effects = effects));
      store.getState().applyLibraryEffects(character.id, effects);
    },
    imagesOpen,
    openImages: () => setImagesOpen(true),
    closeImages: () => setImagesOpen(false),
  };
}
