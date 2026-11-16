"use client";

import Image from "next/image";

import { Button, Icon, Text } from "@/shared/components/atoms";

import {
  IMAGE_ACCEPT,
  IMAGE_FIT,
  PREVIEW_CLASSES,
  REMOVE_LABEL,
  REMOVED_NOTE,
  UNDO_LABEL,
} from "./ImageField.constants";
import { useImageField } from "./ImageField.hook";
import type { ImageFieldProps } from "./ImageField.types";

export function ImageField({
  id,
  label,
  hint,
  shape,
  file,
  currentUrl,
  removed = false,
  error,
  onFileChange,
  onRemoveCurrent,
  onUndoRemove,
}: ImageFieldProps) {
  const {
    previewUrl,
    pickLabel,
    dragging,
    shownError,
    canClear,
    onInputChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onPreviewError,
    onClear,
  } = useImageField({ file, currentUrl, error, onFileChange, onRemoveCurrent });
  return (
    <div>
      <Text variant="fieldLabel" as="span" className="mb-1.5 block">
        {label}
      </Text>
      <div className="flex items-center gap-4">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden ${PREVIEW_CLASSES[shape]}`}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={`Prévia: ${label}`}
              fill
              unoptimized
              sizes="96px"
              onError={onPreviewError}
              className={IMAGE_FIT[shape]}
            />
          ) : (
            <Icon name="image" size={22} aria-hidden className="text-muted-strong" />
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <label
            htmlFor={id}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex min-h-11 min-w-0 cursor-pointer items-center gap-2 border border-dashed px-3 py-2 font-sans text-[15px] text-foreground transition-[border-color,background-color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ruby-400 ${
              dragging
                ? "border-teal-400 bg-teal-900/30"
                : "border-primary/40 bg-black/40 hover:border-primary/70"
            }`}
          >
            <Icon name="upload" size={16} aria-hidden className="shrink-0 text-accent-text" />
            <span className="min-w-0 truncate">{pickLabel}</span>
            <input
              id={id}
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              aria-describedby={`${id}-hint`}
              aria-invalid={shownError ? true : undefined}
              onChange={onInputChange}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id={`${id}-hint`} className="font-sans text-[13px] text-muted-strong">
              {removed ? REMOVED_NOTE : hint}
            </p>
            {removed && onUndoRemove && (
              <Button variant="ghost" size="sm" onClick={onUndoRemove}>
                {UNDO_LABEL}
                <span className="sr-only">: {label}</span>
              </Button>
            )}
            {canClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                icon={<Icon name="trash-2" size={14} />}
              >
                {REMOVE_LABEL}
                <span className="sr-only">: {label}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {shownError && (
        <p role="alert" className="mt-1.5 font-sans text-[13px] font-semibold text-error">
          {shownError}
        </p>
      )}
    </div>
  );
}
