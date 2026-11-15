"use client";

import { FEATURE_KEYS, type FeatureKey } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import type { FeaturesDialogHookProps } from "./FeaturesDialog.types";

/**
 * Checked tags and submit state of the special features dialog (kept in catalog order).
 */
export function useFeaturesDialog({ initialFeatures, onSubmit }: FeaturesDialogHookProps) {
  const formId = useId();
  const [selected, setSelected] = useState<FeatureKey[]>(initialFeatures);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (key: FeatureKey, checked: boolean) =>
    setSelected((current) =>
      FEATURE_KEYS.filter((candidate) =>
        candidate === key ? checked : current.includes(candidate),
      ),
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const failure = await onSubmit(selected);
    setPending(false);
    if (failure) setError(failure);
  };

  return {
    formId,
    keys: FEATURE_KEYS,
    columns: FEATURE_KEYS.length > 2 ? "sm:grid-cols-2" : "",
    selected,
    toggle,
    error,
    pending,
    submit,
  };
}
