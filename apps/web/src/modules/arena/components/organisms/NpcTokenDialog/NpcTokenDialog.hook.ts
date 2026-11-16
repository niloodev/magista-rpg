"use client";

import { ARENA_TOKEN_IMAGE_MAX_BYTES, type TokenStyle } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import { imageFileError } from "@/shared/components/molecules";
import { useFilePreview } from "@/shared/hooks";

import type { NpcTokenDialogProps } from "./NpcTokenDialog.types";

/**
 * Draft, validation and submit state of the NPC token form (name required, image optional and checked here
 * only for type and size; the server checks the real bytes and the pixel size).
 */
export function useNpcTokenDialog({ onSubmit }: Pick<NpcTokenDialogProps, "onSubmit">) {
  const formId = useId();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<TokenStyle>("portrait");
  const preview = useFilePreview(file);
  const [nameError, setNameError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onNameChange = (value: string) => {
    setName(value);
    setNameError(null);
  };

  const onFileChange = (next: File | null) => {
    setFile(next);
    setImageError(
      next
        ? imageFileError(next, ARENA_TOKEN_IMAGE_MAX_BYTES, ARENA_PLACEMENT_TEXTS.imageTooLarge)
        : null,
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(ARENA_PLACEMENT_TEXTS.nameRequired);
      document.getElementById(`${formId}-name`)?.focus();
      return;
    }
    if (imageError) {
      document.getElementById(`${formId}-image`)?.focus();
      return;
    }
    setFormError(null);
    setPending(true);
    const failure = await onSubmit(trimmed, file, file ? style : "portrait");
    setPending(false);
    if (failure) {
      setFormError(failure);
      document.getElementById(`${formId}-name`)?.focus();
    }
  };

  return {
    formId,
    name,
    file,
    style: file ? style : ("portrait" as const),
    preview,
    onStyleChange: setStyle,
    nameError,
    imageError,
    formError,
    pending,
    onNameChange,
    onFileChange,
    submit,
  };
}
