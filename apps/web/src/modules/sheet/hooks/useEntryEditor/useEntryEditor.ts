"use client";

import { useState } from "react";

import { INVALID_FIELD_SELECTOR } from "./useEntryEditor.constants";
import type { EditorMode, EntryEditorOptions, EntryErrors } from "./useEntryEditor.types";

/**
 * Modal editing for list entries: works on a draft copy, validates on save and confirms deletions.
 */
export function useEntryEditor<T extends { id: string }>({
  validate,
  onCreate,
  onUpdate,
  onDelete,
}: EntryEditorOptions<T>) {
  const [mode, setMode] = useState<EditorMode | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [errors, setErrors] = useState<EntryErrors<T>>({});
  const [deleting, setDeleting] = useState<T | null>(null);

  const open = (nextMode: EditorMode, entry: T) => {
    setMode(nextMode);
    setDraft(structuredClone(entry));
    setErrors({});
  };

  const close = () => {
    setMode(null);
    setDraft(null);
    setErrors({});
  };

  const change = (patch: Partial<T>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as (keyof T)[]) delete next[key];
      return next;
    });
  };

  const save = () => {
    if (!draft || !mode) return;
    const found = validate(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      window.requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(INVALID_FIELD_SELECTOR)?.focus(),
      );
      return;
    }
    if (mode === "create") onCreate(draft);
    else onUpdate(draft);
    close();
  };

  const confirmDelete = () => {
    if (!deleting) return;
    onDelete(deleting);
    if (draft?.id === deleting.id) close();
    setDeleting(null);
  };

  return {
    mode,
    draft,
    errors,
    deleting,
    openCreate: (entry: T) => open("create", entry),
    openEdit: (entry: T) => open("edit", entry),
    change,
    save,
    close,
    requestDelete: (entry: T) => setDeleting(entry),
    requestDeleteDraft: () => setDeleting(draft),
    confirmDelete,
    cancelDelete: () => setDeleting(null),
  };
}
