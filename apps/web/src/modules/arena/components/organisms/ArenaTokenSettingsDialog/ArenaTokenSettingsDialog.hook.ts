"use client";

import {
  ARENA_TOKEN_IMAGE_MAX_BYTES,
  type ISheetResource,
  type IUpdateArenaTokenInput,
  type TokenStyle,
} from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { toMediaUrl } from "@/core/services/http";
import { ARENA_PLACEMENT_TEXTS } from "@/modules/arena/arena.constants";
import type { ArenaTokenImageChange } from "@/modules/arena/arena.types";
import { imageFileError } from "@/shared/components/molecules";
import { useFilePreview } from "@/shared/hooks";

import { EMPTY_RESOURCE } from "./ArenaTokenSettingsDialog.constants";
import type { ArenaTokenSettingsDialogProps } from "./ArenaTokenSettingsDialog.types";

/**
 * Draft of the token settings: own name, image, style, health and sanity (NPC only), whether the name shows
 * on the map and who sees the status. Nothing is saved until "Salvar", and only the resources the GM touched
 * are sent (damage applied meanwhile is not undone).
 */
export function useArenaTokenSettingsDialog({
  target,
  onSubmit,
  onOpenSheet,
}: Pick<ArenaTokenSettingsDialogProps, "target" | "onSubmit" | "onOpenSheet">) {
  const formId = useId();
  const npc = target.token.characterId === null;
  const [health, setHealth] = useState<ISheetResource>(target.status?.health ?? EMPTY_RESOURCE);
  const [sanity, setSanity] = useState<ISheetResource>(target.status?.sanity ?? EMPTY_RESOURCE);
  const [name, setName] = useState(target.token.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showName, setShowName] = useState(target.token.showName);
  const [file, setFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const preview = useFilePreview(file);
  const hasImage = Boolean(file) || (target.token.imageUrl !== null && !imageRemoved);
  const canPickStyle = npc && hasImage;
  const [style, setStyle] = useState<TokenStyle>(target.token.style);

  const onNameChange = (value: string) => {
    setName(value);
    setNameError(null);
  };

  const onFileChange = (next: File | null) => {
    setFile(next);
    setImageRemoved(false);
    setImageError(
      next
        ? imageFileError(next, ARENA_TOKEN_IMAGE_MAX_BYTES, ARENA_PLACEMENT_TEXTS.imageTooLarge)
        : null,
    );
  };

  const onRemoveImage = () => {
    setFile(null);
    setImageError(null);
    setImageRemoved(true);
  };
  const [everyone, setEveryone] = useState(target.access.public);
  const [viewerIds, setViewerIds] = useState<string[]>(target.access.accountIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggleViewer = (accountId: string, checked: boolean) =>
    setViewerIds((current) =>
      checked ? [...current, accountId] : current.filter((id) => id !== accountId),
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const trimmed = name.trim();
    if (npc && !trimmed) {
      setNameError(ARENA_PLACEMENT_TEXTS.nameRequired);
      document.getElementById(`${formId}-name`)?.focus();
      return;
    }
    if (imageError) {
      document.getElementById(`${formId}-image`)?.focus();
      return;
    }
    const initial = target.status ?? { health: EMPTY_RESOURCE, sanity: EMPTY_RESOURCE };
    const changed = (now: ISheetResource, before: ISheetResource) =>
      now.current !== before.current || now.max !== before.max;
    const status = {
      ...(changed(health, initial.health) ? { health } : {}),
      ...(changed(sanity, initial.sanity) ? { sanity } : {}),
    };
    const input: IUpdateArenaTokenInput = {
      statusPublic: everyone,
      statusViewerIds: viewerIds,
      ...(npc && Object.keys(status).length > 0 ? { status } : {}),
      ...(npc && trimmed !== target.token.name ? { name: trimmed } : {}),
      ...(showName !== target.token.showName ? { showName } : {}),
      ...(npc && (canPickStyle ? style : "portrait") !== target.token.style
        ? { style: canPickStyle ? style : "portrait" }
        : {}),
    };
    const image: ArenaTokenImageChange = !npc
      ? null
      : file
        ? { action: "upload", file }
        : imageRemoved && target.token.imageUrl
          ? { action: "remove" }
          : null;
    setPending(true);
    const failure = await onSubmit(input, image);
    setPending(false);
    setError(failure);
  };

  const characterId = target.token.characterId;
  const openSheet = () => {
    if (characterId) onOpenSheet(characterId);
  };

  return {
    formId,
    openSheet,
    npc,
    canPickStyle,
    style: canPickStyle ? style : ("portrait" as const),
    name,
    nameError,
    onNameChange,
    showName,
    setShowName,
    file,
    imageRemoved,
    imageError,
    currentImageUrl: imageRemoved ? null : toMediaUrl(target.token.imageUrl),
    styleImageUrl: file ? preview : imageRemoved ? null : toMediaUrl(target.token.imageUrl),
    onFileChange,
    onRemoveImage,
    onUndoRemoveImage: () => setImageRemoved(false),
    setStyle,
    health,
    setHealth,
    sanity,
    setSanity,
    everyone,
    setEveryone,
    viewerIds,
    toggleViewer,
    error,
    pending,
    submit,
  };
}
