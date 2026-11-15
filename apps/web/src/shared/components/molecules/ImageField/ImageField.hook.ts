"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";

import { IMAGE_WRONG_TYPE, PICK_LABELS } from "./ImageField.constants";
import type { ImageFieldProps } from "./ImageField.types";

/**
 * Local preview (object URL) of the chosen file, drag and drop and the clear action of an image field.
 * A chosen file the browser cannot decode is dropped right away with a type error (before any upload),
 * and a saved image that fails to load falls back to the empty icon.
 */
export function useImageField({
  file,
  currentUrl,
  error,
  onFileChange,
  onRemoveCurrent,
}: Pick<ImageFieldProps, "file" | "currentUrl" | "error" | "onFileChange" | "onRemoveCurrent">) {
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl],
  );

  const choose = (next: File | null) => {
    setRejected(false);
    onFileChange(next);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    choose(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) choose(dropped);
  };

  const onPreviewError = () => {
    if (file) {
      onFileChange(null);
      setRejected(true);
      return;
    }
    setBrokenUrl(currentUrl);
  };

  const candidateUrl = fileUrl ?? currentUrl;
  const previewUrl = candidateUrl && candidateUrl !== brokenUrl ? candidateUrl : null;
  const emptyLabel = previewUrl ? PICK_LABELS.replace : PICK_LABELS.empty;
  const pickLabel = file ? file.name : emptyLabel;

  return {
    previewUrl,
    pickLabel,
    dragging,
    shownError: error ?? (rejected ? IMAGE_WRONG_TYPE : null),
    canClear: Boolean(file || currentUrl),
    onInputChange,
    onDragOver,
    onDragLeave: () => setDragging(false),
    onDrop,
    onPreviewError,
    onClear: () => (file ? choose(null) : onRemoveCurrent()),
  };
}
