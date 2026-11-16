"use client";

import type { ISheetResource, IUpdateArenaTokenInput } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { EMPTY_RESOURCE } from "./ArenaTokenSettingsDialog.constants";
import type { ArenaTokenSettingsDialogProps } from "./ArenaTokenSettingsDialog.types";

/**
 * Draft of the token settings: own health and sanity (NPC only) and who sees them; nothing is saved until
 * "Salvar", and only the resources the GM touched are sent (damage applied meanwhile is not undone).
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
    };
    setPending(true);
    const failure = await onSubmit(input);
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
