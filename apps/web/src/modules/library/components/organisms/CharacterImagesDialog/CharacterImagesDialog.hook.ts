"use client";

import {
  CHARACTER_IMAGE_KINDS,
  isErrorResult,
  type CharacterImageKind,
  type ICharacterImages,
  type TokenStyle,
} from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import {
  removeCharacterImage,
  setCharacterTokenSettings,
  uploadCharacterImage,
} from "@/modules/library/services";
import { useAppStoreApi } from "@/modules/shell/store";
import { imageFileError } from "@/shared/components/molecules";

import { EMPTY_DRAFT, IMAGES_SAVED, NOTHING_CHANGED } from "./CharacterImagesDialog.constants";
import type { CharacterImagesDialogProps, ImageDrafts } from "./CharacterImagesDialog.types";
import { imageChangeOf } from "./CharacterImagesDialog.utils";

/**
 * Draft of the AVATAR, ART, isometric FIGURE and token settings of a character: nothing is sent until
 * saving. Each change is applied on its own, so a failed upload keeps its error in the field while the others
 * are already saved.
 */
export function useCharacterImagesDialog({
  characterId,
  avatarUrl,
  artUrl,
  figureUrl,
  tokenStyle,
  showTokenName,
  initialError,
  onClose,
  onSaved,
}: CharacterImagesDialogProps) {
  const formId = useId();
  const store = useAppStoreApi();
  const [saved, setSaved] = useState({ avatar: avatarUrl, art: artUrl, figure: figureUrl });
  const [savedStyle, setSavedStyle] = useState(tokenStyle);
  const [style, setStyle] = useState(tokenStyle);
  const [savedShowName, setSavedShowName] = useState(showTokenName);
  const [showName, setShowName] = useState(showTokenName);
  const [drafts, setDrafts] = useState<ImageDrafts>({
    avatar: EMPTY_DRAFT,
    art: EMPTY_DRAFT,
    figure: EMPTY_DRAFT,
  });
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
    if (kind === "figure" && !saved.figure) setStyle("portrait");
  };

  const hasFigure =
    Boolean(drafts.figure.file) || (Boolean(saved.figure) && !drafts.figure.removed);
  const chosenStyle = hasFigure ? style : "portrait";

  const onStyleChange = (next: TokenStyle) => {
    setFormError(null);
    setStyle(next);
  };

  const onUndoRemove = (kind: CharacterImageKind) => patch(kind, { removed: false });

  const apply = (images: ICharacterImages) => {
    setSaved({ avatar: images.avatarUrl, art: images.artUrl, figure: images.figureUrl });
    setSavedStyle(images.tokenStyle);
    setSavedShowName(images.showTokenName);
    store.getState().applyLibraryImages(images);
    store.getState().applySheetImages(images);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (drafts.avatar.error || drafts.art.error || drafts.figure.error) return;
    const changes = CHARACTER_IMAGE_KINDS.map((kind) =>
      imageChangeOf(kind, drafts[kind], saved[kind]),
    ).filter((change) => change !== null);
    const styleChanged = chosenStyle !== savedStyle;
    const showNameChanged = showName !== savedShowName;
    if (changes.length === 0 && !styleChanged && !showNameChanged) {
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
    if ((styleChanged || showNameChanged) && !failed) {
      const result = await setCharacterTokenSettings(characterId, {
        ...(styleChanged ? { style: chosenStyle } : {}),
        ...(showNameChanged ? { showName } : {}),
      });
      if (isErrorResult(result)) {
        failed = true;
        setFormError(result.error);
      } else {
        apply(result.payload.images);
      }
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
    style: chosenStyle,
    figureDisabled: !hasFigure,
    onStyleChange,
    showName,
    onShowNameChange: (next: boolean) => {
      setFormError(null);
      setShowName(next);
    },
    isRemoved: (kind: CharacterImageKind) => drafts[kind].removed && Boolean(saved[kind]),
    onFileChange,
    onRemoveCurrent,
    onUndoRemove,
    submit,
  };
}
