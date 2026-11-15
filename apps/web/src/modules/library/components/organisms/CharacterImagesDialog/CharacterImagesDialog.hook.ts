"use client";

import { isErrorResult, type CharacterImageKind, type ICharacterImages } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { removeCharacterImage, uploadCharacterImage } from "@/modules/library/services";
import { useAppStoreApi } from "@/modules/shell/store";
import { imageFileError } from "@/shared/components/molecules";

import { EMPTY_DRAFT, IMAGES_SAVED, NOTHING_CHANGED } from "./CharacterImagesDialog.constants";
import type { CharacterImagesDialogProps, ImageDrafts } from "./CharacterImagesDialog.types";
import { imageChangeOf } from "./CharacterImagesDialog.utils";

/**
 * Draft of the AVATAR and ART of a character: nothing is sent until saving. Each change is applied on its own,
 * so a failed upload keeps its error in the field while the other one is already saved.
 */
export function useCharacterImagesDialog({
  characterId,
  avatarUrl,
  artUrl,
  initialError,
  onClose,
  onSaved,
}: CharacterImagesDialogProps) {
  const formId = useId();
  const store = useAppStoreApi();
  const [saved, setSaved] = useState({ avatar: avatarUrl, art: artUrl });
  const [drafts, setDrafts] = useState<ImageDrafts>({ avatar: EMPTY_DRAFT, art: EMPTY_DRAFT });
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);

  const patch = (kind: CharacterImageKind, next: Partial<ImageDrafts[CharacterImageKind]>) =>
    setDrafts((current) => ({ ...current, [kind]: { ...current[kind], ...next } }));

  const onFileChange = (kind: CharacterImageKind, file: File | null) => {
    setFormError(null);
    patch(kind, { file, removed: false, error: file ? imageFileError(file) : null });
  };

  const onRemoveCurrent = (kind: CharacterImageKind) => {
    setFormError(null);
    patch(kind, { file: null, removed: true, error: null });
  };

  const onUndoRemove = (kind: CharacterImageKind) => patch(kind, { removed: false });

  const apply = (images: ICharacterImages) => {
    setSaved({ avatar: images.avatarUrl, art: images.artUrl });
    store.getState().applyLibraryImages(images);
    store.getState().applySheetImages(images);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (drafts.avatar.error || drafts.art.error) return;
    const changes = (["avatar", "art"] as const)
      .map((kind) => imageChangeOf(kind, drafts[kind], saved[kind]))
      .filter((change) => change !== null);
    if (changes.length === 0) {
      setFormError(NOTHING_CHANGED);
      return;
    }
    setPending(true);
    let failed = false;
    for (const change of changes) {
      const result =
        change.action === "upload"
          ? await uploadCharacterImage(characterId, change.kind, change.file)
          : await removeCharacterImage(characterId, change.kind);
      if (isErrorResult(result)) {
        failed = true;
        patch(change.kind, { error: result.error });
        continue;
      }
      apply(result.payload.images);
      patch(change.kind, EMPTY_DRAFT);
    }
    setPending(false);
    if (failed) return;
    onSaved?.(IMAGES_SAVED);
    onClose();
  };

  const currentUrlOf = (kind: CharacterImageKind) => (drafts[kind].removed ? null : saved[kind]);

  return {
    formId,
    drafts,
    formError,
    pending,
    currentUrlOf,
    isRemoved: (kind: CharacterImageKind) => drafts[kind].removed && Boolean(saved[kind]),
    onFileChange,
    onRemoveCurrent,
    onUndoRemove,
    submit,
  };
}
