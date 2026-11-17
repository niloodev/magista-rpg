"use client";

import { autoEffectStyle, type ArenaEffectStyle, type ISheetEffects } from "@magista/shared";
import { useEffect, useId, useState, type FormEvent } from "react";

import { ARENA_EFFECT_CATALOG } from "@/modules/arena/arena.constants";

import { SHEET_EFFECT_SLOTS, SHEET_EFFECTS_TEXTS } from "./SheetEffectsDialog.constants";
import type { ISheetEffectSlot, SheetEffectsDialogProps } from "./SheetEffectsDialog.types";
import { withSheetEffect } from "./SheetEffectsDialog.utils";

/**
 * Draft of the sheet animations: each slot picks an effect in the effect picker (or the default); nothing
 * reaches the sheet until "Salvar animações".
 */
export function useSheetEffectsDialog({
  effects,
  onSave,
  onClose,
}: Pick<SheetEffectsDialogProps, "effects" | "onSave" | "onClose">) {
  const formId = useId();
  const [draft, setDraft] = useState<ISheetEffects>(effects);
  const [picking, setPicking] = useState<ISheetEffectSlot | null>(null);

  useEffect(() => {
    void import("@/modules/arena/components/organisms/ArenaEffectPickerDialog");
  }, []);

  const rows = SHEET_EFFECT_SLOTS.map((slot) => {
    const chosen = draft[slot.kind]?.[slot.resource];
    const style: ArenaEffectStyle = chosen ?? autoEffectStyle(slot.kind, slot.resource);
    const entry = ARENA_EFFECT_CATALOG[style];
    return {
      slot,
      chosen: chosen ?? null,
      name: chosen ? entry.name : SHEET_EFFECTS_TEXTS.standard(entry.name),
      accent: entry.accent,
    };
  });

  const choose = (choice: ArenaEffectStyle | "auto") => {
    if (picking)
      setDraft((current) => withSheetEffect(current, picking.kind, picking.resource, choice));
    setPicking(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(draft);
    onClose();
  };

  return {
    formId,
    rows,
    picking,
    pickingValue: (picking ? (draft[picking.kind]?.[picking.resource] ?? "auto") : "auto") as
      ArenaEffectStyle | "auto",
    openPicker: setPicking,
    closePicker: () => setPicking(null),
    choose,
    submit,
  };
}
