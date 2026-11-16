"use client";

import type { CharacterImageKind } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { imageFileError } from "@/shared/components/molecules";

import { NAME_REQUIRED, ROOT_OPTION_VALUE } from "./NameDialog.constants";
import type { INameDialogImages, NameDialogProps } from "./NameDialog.types";

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
  const [images, setImages] = useState<INameDialogImages>({
    avatar: null,
    art: null,
    figure: null,
  });
  const [imageErrors, setImageErrors] = useState<Record<CharacterImageKind, string | null>>({
    avatar: null,
    art: null,
    figure: null,
  });

  const onImageChange = (kind: CharacterImageKind, file: File | null) => {
    setImages((current) => ({ ...current, [kind]: file }));
    setImageErrors((current) => ({ ...current, [kind]: file ? imageFileError(file) : null }));
  };

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
    if (imageErrors.avatar || imageErrors.art || imageErrors.figure) return;
    setPending(true);
    const failure = await onSubmit({
      name: trimmed,
      folderId: folderValue === ROOT_OPTION_VALUE ? null : folderValue,
      images,
    });
    setPending(false);
    if (failure) setError(failure);
  };

  return {
    formId,
    name,
    folderValue,
    error,
    pending,
    images,
    imageErrors,
    onNameChange,
    onImageChange,
    setFolderValue,
    submit,
  };
}
