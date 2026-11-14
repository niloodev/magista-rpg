"use client";

import { useState, type ChangeEvent } from "react";

import type { NumberFieldHookProps } from "./NumberField.types";
import { clamp } from "./NumberField.utils";

/**
 * Keeps a text draft while typing (so "-" or "" are allowed) and commits valid integers.
 */
export function useNumberField({
  value,
  onValueChange,
  min,
  max,
  allowEmpty = true,
}: NumberFieldHookProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value.replace(/[^\d-]/g, "");
    setDraft(text);
    if (text === "" && allowEmpty) onValueChange(null);
    const parsed = Number.parseInt(text, 10);
    if (Number.isFinite(parsed)) onValueChange(clamp(parsed, min, max));
  };

  const onBlur = () => setDraft(null);

  return { text: draft ?? (value === null ? "" : String(value)), onChange, onBlur };
}
