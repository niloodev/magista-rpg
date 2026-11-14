"use client";

import { useId, useState, type FormEvent } from "react";

import { NAME_REQUIRED, ROOT_OPTION_VALUE } from "./NameDialog.constants";
import type { NameDialogProps } from "./NameDialog.types";

/**
 * Draft, validation and submit state of the name (and optional folder) form.
 */
export function useNameDialog({
  initialName,
  initialFolderId,
  onSubmit,
}: Pick<NameDialogProps, "initialName" | "initialFolderId" | "onSubmit">) {
  const formId = useId();
  const [name, setName] = useState(initialName);
  const [folderValue, setFolderValue] = useState(initialFolderId ?? ROOT_OPTION_VALUE);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onNameChange = (value: string) => {
    setName(value);
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(NAME_REQUIRED);
      return;
    }
    setPending(true);
    const failure = await onSubmit({
      name: trimmed,
      folderId: folderValue === ROOT_OPTION_VALUE ? null : folderValue,
    });
    setPending(false);
    if (failure) setError(failure);
  };

  return { formId, name, folderValue, error, pending, onNameChange, setFolderValue, submit };
}
