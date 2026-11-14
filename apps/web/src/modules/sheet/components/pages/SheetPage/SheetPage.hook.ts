"use client";

import {
  deriveSheet,
  isErrorResult,
  type ICharacterUpdatedEvent,
  type IRollKind,
  type IRollResult,
} from "@magista/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CLIENT_ID } from "@/core/services/http";
import { fetchCharacter, levelUp, saveSheet } from "@/modules/sheet/services";
import { AUTOSAVE_DEBOUNCE_MS, SHEET_ART_HINT_KEY } from "@/modules/sheet/sheet.constants";
import type { SheetTab } from "@/modules/sheet/sheet.types";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { requestRoll } from "@/modules/table/services";

import type { SheetPageProps } from "./SheetPage.types";
import { saveWithReconcile } from "./SheetPage.utils";

/**
 * Loads a character, autosaves edits (debounced, one save at a time), applies remote updates and sends rolls.
 * A rejected save is reconciled once: if the server has a newer version, the GM-only fields are merged in and it retries.
 */
export function useSheetPage({ characterId }: SheetPageProps) {
  const store = useAppStoreApi();
  const socket = useTableSocket();
  const sheetState = useApp((state) => state.sheet);
  const rolls = useApp((state) => state.table.rolls);
  const rollsLoaded = useApp((state) => state.table.rollsLoaded);
  const { setHint } = useSkeletonHintActions();
  const connection = useApp((state) => state.table.connection);
  const editSheet = useApp((state) => state.editSheet);
  const [rollError, setRollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SheetTab>("geral");
  const [activeRoll, setActiveRoll] = useState<IRollResult | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpLoading, setLevelUpLoading] = useState(false);
  const [levelUpError, setLevelUpError] = useState<string | null>(null);
  const isGm = useApp((state) => state.session.data?.account.role === "GM");
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const { startSheetLoad, finishSheetLoad, failSheetLoad } = store.getState();
    startSheetLoad(characterId);
    void fetchCharacter(characterId).then((result) =>
      isErrorResult(result)
        ? failSheetLoad(characterId, result.error)
        : finishSheetLoad(result.payload),
    );
  }, [characterId, store]);

  const flush = useCallback(async (): Promise<void> => {
    while (inFlight.current) await inFlight.current.catch(() => undefined);
    const task = saveWithReconcile({
      read: () => store.getState().sheet,
      save: saveSheet,
      fetchLatest: fetchCharacter,
      markSaving: () => store.getState().markSheetSaving(),
      markSaved: (id, revision, updatedAt) =>
        store.getState().markSheetSaved(id, revision, updatedAt),
      markFailed: (id, error) => store.getState().markSheetSaveFailed(id, error),
      applyRemote: (latest) => store.getState().applyRemoteCharacter(latest),
    });
    inFlight.current = task;
    try {
      await task;
    } finally {
      if (inFlight.current === task) inFlight.current = null;
    }
  }, [store]);

  useEffect(() => {
    if (sheetState.revision === sheetState.savedRevision) return;
    const timer = window.setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [sheetState.revision, sheetState.savedRevision, flush]);

  useEffect(() => () => void flush(), [flush]);

  useEffect(() => {
    if (!socket) return;
    const onUpdated = ({ character, origin }: ICharacterUpdatedEvent) => {
      if (origin !== CLIENT_ID) store.getState().applyRemoteCharacter(character);
    };
    let connectedBefore = socket.connected;
    const onReconnect = () => {
      if (connectedBefore)
        void fetchCharacter(characterId).then((result) => {
          if (!isErrorResult(result)) store.getState().applyRemoteCharacter(result.payload);
        });
      connectedBefore = true;
    };
    socket.on("character:updated", onUpdated);
    socket.on("connect", onReconnect);
    return () => {
      socket.off("character:updated", onUpdated);
      socket.off("connect", onReconnect);
    };
  }, [socket, store, characterId]);

  const requested = sheetState.requestedId === characterId;
  const character =
    requested && sheetState.character?.id === characterId ? sheetState.character : null;
  const hasArt = character ? Boolean(character.avatarUrl) : null;

  useEffect(() => {
    if (hasArt !== null) setHint(SHEET_ART_HINT_KEY, hasArt ? 1 : 0);
  }, [hasArt, setHint]);
  const derived = useMemo(() => (character ? deriveSheet(character.sheet) : null), [character]);

  const onRoll = useCallback(
    async (roll: IRollKind) => {
      await flush();
      const result = await requestRoll({ socket, request: { characterId, roll } });
      if (result.ok) {
        setRollError(null);
        setActiveRoll(result.roll);
        return;
      }
      setRollError(result.error);
    },
    [characterId, flush, socket],
  );

  const onLevelUp = useCallback(
    async (addToCurrent: boolean) => {
      setLevelUpLoading(true);
      setLevelUpError(null);
      await flush();
      const result = await levelUp(characterId, addToCurrent);
      setLevelUpLoading(false);
      if (isErrorResult(result)) {
        setLevelUpError(result.error);
        return;
      }
      store.getState().replaceCharacter(result.payload.character);
      setLevelUpOpen(false);
      setActiveRoll(result.payload.roll);
    },
    [characterId, flush, store],
  );

  return {
    status: requested ? sheetState.status : "loading",
    loadError: sheetState.error,
    character,
    derived,
    saveStatus: sheetState.saveStatus,
    saveError: sheetState.saveError,
    rolls,
    rollsLoading: !rollsLoaded && connection !== "disconnected",
    connection,
    rollError,
    activeTab,
    activeRoll,
    isGm,
    levelUpOpen,
    levelUpLoading,
    levelUpError,
    onOpenLevelUp: () => {
      setLevelUpError(null);
      setLevelUpOpen(true);
    },
    onCloseLevelUp: () => setLevelUpOpen(false),
    onLevelUp: (addToCurrent: boolean) => void onLevelUp(addToCurrent),
    onCloseRoll: () => setActiveRoll(null),
    onTabChange: setActiveTab,
    onEdit: editSheet,
    onRoll: (roll: IRollKind) => void onRoll(roll),
    onRetrySave: () => void flush(),
  };
}
