"use client";

import {
  autoEffectStyle,
  canControlToken,
  isErrorResult,
  type IAccount,
  type IArenaCharacterStatusEvent,
  type IArenaEffectEvent,
  type ICharacterUpdatedEvent,
} from "@magista/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toMediaUrl } from "@/core/services/http";

import {
  ARENA_CHANGE_TEXTS,
  ARENA_EFFECT_CATALOG,
  ARENA_EFFECT_TEXTS,
  ARENA_STATUS_TEXTS,
} from "@/modules/arena/arena.constants";
import type { IArenaChangeMenuState, IArenaChangePreference } from "@/modules/arena/arena.types";
import {
  changeTargets,
  readChangePreference,
  saveChangePreference,
  statusReadout,
} from "@/modules/arena/arena.utils";
import { applyArenaChange, fetchArenaAccounts, updateArenaToken } from "@/modules/arena/services";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import type { LoadStatus } from "@/shared/types";

import type {
  IArenaTokenStatusControls,
  UseArenaTokenStatusProps,
} from "./useArenaTokenStatus.types";

const CLOSED_ACCESS = { public: false, accountIds: [] };

/**
 * Health and sanity of the tokens: follows the statuses sent to this tab (token permissions, sheet saves) and
 * plays the damage and healing animations; drives "Aplicar mudança" (anyone, any visible token) and the token
 * settings dialog of the GM (own status of an NPC and who may see it).
 */
export function useArenaTokenStatus({
  isGm,
  controlsRef,
  onAnnounce,
}: UseArenaTokenStatusProps): IArenaTokenStatusControls {
  const socket = useTableSocket();
  const store = useAppStoreApi();
  const view = useApp((state) => state.arena.view);
  const selectedTokenIds = useApp((state) => state.arena.selectedTokenIds);
  const libraryStatus = useApp((state) => state.library.status);
  const libraryAccounts = useApp((state) => state.library.accounts);
  const libraryCharacters = useApp((state) => state.library.characters);
  const [changeMenu, setChangeMenu] = useState<IArenaChangeMenuState | null>(null);
  const [changePreference, setChangePreference] =
    useState<IArenaChangePreference>(readChangePreference);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changePending, setChangePending] = useState(false);
  const [settingsTokenId, setSettingsTokenId] = useState<string | null>(null);
  const [chosenAttacker, setAttackerId] = useState("");
  const [effectPickerOpen, setEffectPickerOpen] = useState(false);
  const [fetchedAccounts, setFetchedAccounts] = useState<IAccount[] | null>(null);
  const [accountsFailed, setAccountsFailed] = useState(false);
  const [accountsAttempt, setAccountsAttempt] = useState(0);

  useEffect(() => {
    if (!socket) return;
    const { applyArenaStatus, applyCharacterStatus } = store.getState();
    const onCharacterStatus = ({ characterId, status }: IArenaCharacterStatusEvent) =>
      applyCharacterStatus(characterId, status);
    const onCharacterUpdated = ({ character }: ICharacterUpdatedEvent) => {
      const { health, sanity } = character.sheet.resources;
      applyCharacterStatus(character.id, { health, sanity });
    };
    const onEffect = ({ sceneId, effects }: IArenaEffectEvent) => {
      if (store.getState().arena.view?.scene?.id === sceneId)
        controlsRef.current?.playEffects(effects);
    };
    socket.on("arena:status", applyArenaStatus);
    socket.on("arena:character-status", onCharacterStatus);
    socket.on("character:updated", onCharacterUpdated);
    socket.on("arena:effect", onEffect);
    return () => {
      socket.off("arena:status", applyArenaStatus);
      socket.off("arena:character-status", onCharacterStatus);
      socket.off("character:updated", onCharacterUpdated);
      socket.off("arena:effect", onEffect);
    };
  }, [socket, store, controlsRef]);

  const tokenName = useCallback(
    (tokenId: string) => view?.tokens.find((token) => token.id === tokenId)?.name ?? "",
    [view],
  );

  const tokenImage = useCallback(
    (tokenId: string) => {
      const token = view?.tokens.find((entry) => entry.id === tokenId);
      return token ? toMediaUrl(token.imageThumbUrl ?? token.imageUrl) : null;
    },
    [view],
  );

  const openChangeMenu = useCallback(
    (tokenId: string | null, anchor: { x: number; y: number } | null) => {
      const tokenIds = tokenId ? changeTargets(selectedTokenIds, tokenId) : [...selectedTokenIds];
      const first = tokenIds[0];
      if (!first) return;
      setChangeError(null);
      setChangeMenu({
        tokenIds,
        target: ARENA_CHANGE_TEXTS.target(tokenName(first), tokenIds.length),
        targetImages: tokenIds.slice(0, 3).map(tokenImage),
        anchor,
      });
    },
    [selectedTokenIds, tokenName, tokenImage],
  );

  const closeChangeMenu = useCallback(() => {
    setChangeMenu(null);
    setChangeError(null);
    setEffectPickerOpen(false);
  }, []);

  const attackerOptions = useMemo(() => {
    if (!changeMenu || !view) return [];
    const viewer = { role: isGm ? ("GM" as const) : ("PLAYER" as const) };
    return view.tokens
      .filter(
        (token) =>
          !changeMenu.tokenIds.includes(token.id) &&
          canControlToken(viewer, token, view.controllableCharacterIds),
      )
      .map((token) => ({
        id: token.id,
        name: token.name,
        imageUrl: toMediaUrl(token.imageThumbUrl ?? token.imageUrl),
      }));
  }, [changeMenu, view, isGm]);

  const attackerId = attackerOptions.some((option) => option.id === chosenAttacker)
    ? chosenAttacker
    : "";

  const updateChange: IArenaTokenStatusControls["updateChange"] = useCallback((patch) => {
    setChangePreference((current) => {
      const next = { ...current, ...patch };
      saveChangePreference(next);
      return next;
    });
  }, []);

  const openEffectPicker = useCallback(() => setEffectPickerOpen(true), []);
  const chooseEffect = useCallback(
    (effect: IArenaChangePreference["effect"]) => {
      updateChange({ effect });
      setEffectPickerOpen(false);
    },
    [updateChange],
  );
  const effectLabel =
    changePreference.effect === "auto"
      ? ARENA_EFFECT_TEXTS.autoShort(
          ARENA_EFFECT_CATALOG[autoEffectStyle(changePreference.kind, changePreference.resource)]
            .name,
        )
      : ARENA_EFFECT_CATALOG[changePreference.effect].name;
  const closeEffectPicker = useCallback(() => setEffectPickerOpen(false), []);

  const applyChange: IArenaTokenStatusControls["applyChange"] = async (amount) => {
    if (!changeMenu || changePending) return false;
    const { kind, resource, effect } = changePreference;
    setChangePending(true);
    const result = await applyArenaChange(socket, {
      tokenIds: changeMenu.tokenIds,
      kind,
      resource,
      amount,
      ...(attackerId ? { attackerTokenId: attackerId } : {}),
      ...(effect === "auto" ? {} : { effect }),
    });
    setChangePending(false);
    if (!result.ok) {
      setChangeError(result.error);
      return false;
    }
    const preference = { ...changePreference, amount };
    setChangePreference(preference);
    saveChangePreference(preference);
    setChangeError(null);
    onAnnounce(
      ARENA_CHANGE_TEXTS.applied(
        ARENA_CHANGE_TEXTS.submit(kind, resource, amount),
        changeMenu.target,
      ),
    );
    return true;
  };

  const selectedId = selectedTokenIds.length === 1 ? selectedTokenIds[0] : undefined;
  const selectedStatus = selectedId ? view?.statuses[selectedId] : undefined;
  const selectedLabel = statusReadout(selectedStatus);
  const selectionStatus =
    selectedStatus && selectedLabel ? { status: selectedStatus, label: selectedLabel } : null;

  const settingsToken = settingsTokenId
    ? (view?.tokens.find((token) => token.id === settingsTokenId) ?? null)
    : null;

  const accountsReady = libraryStatus === "ready" ? libraryAccounts : fetchedAccounts;

  useEffect(() => {
    if (!settingsTokenId || !isGm || libraryStatus === "ready" || fetchedAccounts || accountsFailed)
      return;
    let active = true;
    void fetchArenaAccounts().then((result) => {
      if (!active) return;
      if (isErrorResult(result)) setAccountsFailed(true);
      else setFetchedAccounts(result.payload);
    });
    return () => {
      active = false;
    };
  }, [settingsTokenId, isGm, libraryStatus, fetchedAccounts, accountsFailed, accountsAttempt]);

  const retryAccounts = useCallback(() => {
    setAccountsFailed(false);
    setAccountsAttempt((attempt) => attempt + 1);
  }, []);

  const accountsStatus: LoadStatus = accountsReady ? "ready" : accountsFailed ? "error" : "loading";
  const accounts = useMemo(
    () => (accountsReady ?? []).filter((account) => account.role === "PLAYER"),
    [accountsReady],
  );

  const settings = useMemo(() => {
    if (!settingsToken || !view) return null;
    const character = settingsToken.characterId
      ? libraryCharacters.find((entry) => entry.id === settingsToken.characterId)
      : undefined;
    const loginOf = new Map((accountsReady ?? []).map((account) => [account.id, account.login]));
    return {
      token: settingsToken,
      status: view.statuses[settingsToken.id] ?? null,
      access: view.statusAccess?.[settingsToken.id] ?? CLOSED_ACCESS,
      sheetLogins: (character?.accountIds ?? []).flatMap((id) => loginOf.get(id) ?? []),
    };
  }, [settingsToken, view, libraryCharacters, accountsReady]);

  const openSettings = useCallback(() => {
    if (isGm && selectedId) setSettingsTokenId(selectedId);
  }, [isGm, selectedId]);

  const closeSettings = useCallback(() => setSettingsTokenId(null), []);

  const saveSettings: IArenaTokenStatusControls["saveSettings"] = async (input) => {
    if (!settingsTokenId) return null;
    const result = await updateArenaToken(settingsTokenId, input);
    if (isErrorResult(result)) return result.error;
    onAnnounce(ARENA_STATUS_TEXTS.saved);
    setSettingsTokenId(null);
    return null;
  };

  return {
    changeMenu,
    changePreference,
    updateChange,
    effectLabel,
    chooseEffect,
    effectPickerOpen,
    openEffectPicker,
    closeEffectPicker,
    changeError,
    changePending,
    openChangeMenu,
    closeChangeMenu,
    applyChange,
    attackerOptions,
    attackerId,
    setAttackerId,
    selectionStatus,
    settings,
    openSettings,
    closeSettings,
    accounts,
    accountsStatus,
    retryAccounts,
    saveSettings,
  };
}
