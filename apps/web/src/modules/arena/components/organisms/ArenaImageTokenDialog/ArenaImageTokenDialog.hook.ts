"use client";

import type { TokenStyle } from "@magista/shared";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { tokenNameFromFile } from "@/modules/arena/arena.utils";
import { useFilePreviews } from "@/shared/hooks";

import type { ArenaImageTokenDialogProps } from "./ArenaImageTokenDialog.types";
import { looksLikeFigure } from "./ArenaImageTokenDialog.utils";

/**
 * Names (from the file names) and style of the tokens made from dropped images. The style starts as the one
 * the first image suggests (transparent border: isometric) until the GM picks one.
 */
export function useArenaImageTokenDialog({ files, onSubmit }: ArenaImageTokenDialogProps) {
  const formId = useId();
  const [names, setNames] = useState(() => files.map((file) => tokenNameFromFile(file.name)));
  const [style, setStyle] = useState<TokenStyle>("portrait");
  const picked = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const previews = useFilePreviews(files);

  useEffect(() => {
    const [first] = files;
    if (!first) return;
    let active = true;
    void looksLikeFigure(first).then((figure) => {
      if (active && !picked.current) setStyle(figure ? "figure" : "portrait");
    });
    return () => {
      active = false;
    };
  }, [files]);

  const onStyleChange = (next: TokenStyle) => {
    picked.current = true;
    setStyle(next);
  };

  const onNameChange = (index: number, value: string) =>
    setNames((current) => current.map((name, at) => (at === index ? value : name)));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setPending(true);
    const failure = await onSubmit(names, style);
    setPending(false);
    if (failure) setFormError(failure);
  };

  return {
    formId,
    count: files.length,
    names,
    previews,
    style,
    formError,
    pending,
    onStyleChange,
    onNameChange,
    submit,
  };
}
