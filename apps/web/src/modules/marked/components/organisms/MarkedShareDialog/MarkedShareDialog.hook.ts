"use client";

import { useState, type FormEvent } from "react";

import type { MarkedShareDialogHookProps } from "./MarkedShareDialog.types";

/**
 * Keeps the chosen trait (the first one by default, reset when the dialog reopens) and submits it.
 */
export function useMarkedShareDialog({ open, traits, onSubmit }: MarkedShareDialogHookProps) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setChosenId(null);
  }
  const selectedId = traits.some((trait) => trait.id === chosenId)
    ? chosenId
    : (traits[0]?.id ?? null);
  const selected = traits.find((trait) => trait.id === selectedId) ?? null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId) onSubmit(selectedId);
  };
  return { selectedId, selected, choose: setChosenId, submit };
}
