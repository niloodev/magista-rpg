"use client";

import {
  deriveSheet,
  isErrorResult,
  type ICharacterUpdatedEvent,
  type IPingEntry,
  type IRollKind,
  type IRollResult,
} from "@magista/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CLIENT_ID } from "@/core/services/http";
import { fetchCharacter, levelUp, saveSheet } from "@/modules/sheet/services";
import {
  AUTOSAVE_DEBOUNCE_MS,
  PING_FEEDBACK_MS,
  SHEET_ART_HINT_KEY,
  SHEET_TABS,
} from "@/modules/sheet/sheet.constants";
import type { SheetMutator, SheetTab } from "@/modules/sheet/sheet.types";
import { EMPTY_SHEET_ENTRY } from "@/modules/sheet/store";
import { useSkeletonHintActions } from "@/modules/shell/providers";
import { useApp, useAppStoreApi } from "@/modules/shell/store";
import { useTableSocket } from "@/modules/table/providers";
import { pingEntry, requestRoll } from "@/modules/table/services";

import { NO_SHEET_ROLLS, SHEET_TABS_ID } from "./SheetPage.constants";
import type { SheetPageProps } from "./SheetPage.types";
import { saveExclusively, saveWithReconcile } from "./SheetPage.utils";

/**
 * Loads a character, autosaves edits (debounced, one save at a time), applies remote updates and sends rolls.
 * A rejected save is reconciled once: if the server has a newer version, the GM-only fields are merged in and it retries.
 */
export function useSheetPage({ characterId, variant = "page" }: SheetPageProps) {
  const store = useAppStoreApi();
  const socket = useTableSocket();
  const libraryArt = useApp((state) =>
    variant === "panel"
      ? state.library.characters.find((item) => item.id === characterId)?.artUrl
      : undefined,
  );
  const sheetState = useApp((state) => {
    const entry = state.sheets[characterId];
    return entry && entry.accountId === (state.session.data?.account.id ?? null)
      ? entry
      : EMPTY_SHEET_ENTRY;
  });
  const rolls = useApp((state) => (variant === "panel" ? NO_SHEET_ROLLS : state.table.rolls));
  const rollsLoaded = useApp((state) => variant === "panel" || state.table.rollsLoaded);
  const { setHint } = useSkeletonHintActions();
  const connection = useApp((state) => state.table.connection);
  const [rollError, setRollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SheetTab>("geral");
  const [activeRoll, setActiveRoll] = useState<IRollResult | null>(null);
  const [pingedId, setPingedId] = useState<string | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpLoading, setLevelUpLoading] = useState(false);
  const [levelUpError, setLevelUpError] = useState<string | null>(null);
  const isGm = useApp((state) => state.session.data?.account.role === "GM");

  const load = useCallback(() => {
    const { startSheetLoad, finishSheetLoad, failSheetLoad } = store.getState();
    const accountId = store.getState().session.data?.account.id ?? null;
    startSheetLoad(characterId);
    void fetchCharacter(characterId).then((result) => {
      if ((store.getState().session.data?.account.id ?? null) !== accountId) return;
      if (isErrorResult(result)) failSheetLoad(characterId, result.error);
      else finishSheetLoad(result.payload);
    });
  }, [characterId, store]);

  useEffect(() => load(), [load]);

  const flush = useCallback(
    (): Promise<void> =>
      saveExclusively(characterId, () =>
        saveWithReconcile({
          read: () => store.getState().sheets[characterId] ?? EMPTY_SHEET_ENTRY,
          save: saveSheet,
          fetchLatest: fetchCharacter,
          markSaving: () => store.getState().markSheetSaving(characterId),
          markSaved: (id, revision, updatedAt) =>
            store.getState().markSheetSaved(id, revision, updatedAt),
          markFailed: (id, error) => store.getState().markSheetSaveFailed(id, error),
          applyRemote: (latest) => store.getState().applyRemoteCharacter(latest),
        }),
      ),
    [store, characterId],
  );

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

  const character = sheetState.character?.id === characterId ? sheetState.character : null;
  const hasArt = character ? Boolean(character.artUrl) : null;

  useEffect(() => {
    if (hasArt !== null && variant !== "panel") setHint(SHEET_ART_HINT_KEY, hasArt ? 1 : 0);
  }, [hasArt, setHint, variant]);
  const derived = useMemo(
    () => (character ? deriveSheet(character.sheet, { features: character.features }) : null),
    [character],
  );

  const onEdit = useCallback(
    (mutator: SheetMutator) => store.getState().editSheet(characterId, mutator),
    [store, characterId],
  );

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

  const onPing = useCallback(
    async (entry: IPingEntry) => {
      await flush();
      const result = await pingEntry({ socket, request: { characterId, entry } });
      if (!result.ok) {
        setRollError(result.error);
        return;
      }
      setRollError(null);
      setPingedId(entry.id);
    },
    [characterId, flush, socket],
  );

  useEffect(() => {
    if (pingedId === null) return;
    const timer = window.setTimeout(() => setPingedId(null), PING_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [pingedId]);

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

  const panel = variant === "panel";

  return {
    panel,
    skeletonArt: libraryArt === undefined ? undefined : Boolean(libraryArt),
    tabItems: panel ? SHEET_TABS.filter((item) => item.key !== "rolagens") : SHEET_TABS,
    tabsIdPrefix: panel ? `${SHEET_TABS_ID}-${characterId}` : SHEET_TABS_ID,
    status: sheetState.status === "idle" ? "loading" : sheetState.status,
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
    onEdit,
    onRoll: (roll: IRollKind) => void onRoll(roll),
    onPing: (entry: IPingEntry) => void onPing(entry),
    pingedId,
    flush,
    onRetrySave: () => void flush(),
    onReload: load,
  };
}
